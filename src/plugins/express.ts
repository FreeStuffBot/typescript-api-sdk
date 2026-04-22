import { getCompatibility, getUa } from '../const' with { type: 'macro' };

import type { Request, Response, NextFunction } from 'express';
import type { KeyObject } from 'node:crypto';
import express, { raw } from 'express';
import { newSignedMessageVerifier, type VerifierOptions } from '../verifier';
import { emit } from '../events';
import { parseEvent } from '../parser';


type ExpressOptions = Partial<Omit<VerifierOptions, 'publicKey'> & { debug?: boolean; }>

/** Add freestuff webhooks to any existing express app */
export function createExpressHandler(pubkey: string | KeyObject, options?: ExpressOptions) {
  const verifier = newSignedMessageVerifier({
    publicKey: pubkey,
    ...(options ?? {}),
  });

  const rawParser = raw({ type: '*/*' });

  return (req: Request, res: Response, next: NextFunction) => {
    rawParser(req, res, (err) => {
      res.header('X-Set-Compatibility-Date', getCompatibility());
      res.header('X-Client-Library', getUa());

      if (err) {
        return void res.status(500).send('Error parsing request body');
      }

      if (!req.body) {
        return void res.status(400).send('Missing body');
      }

      if (!Buffer.isBuffer(req.body)) {
        console.warn('Webhook body is not a Buffer! Please move any mentions of `use(express.json())` after the webhook handler.');
        return void res.status(500).send('Invalid server configuration');
      }

      const result = verifier({
        data: req.body,
        signature: String(req.headers['webhook-signature']),
        messageId: String(req.headers['webhook-id']),
        timestamp: String(req.headers['webhook-timestamp']),
      });

      if (options?.debug) {
        console.log('in>', {
          data: req.body,
          signature: String(req.headers['webhook-signature']),
          messageId: String(req.headers['webhook-id']),
          timestamp: String(req.headers['webhook-timestamp']),
        });
        console.log('out>', result);
      }

      if (!result.success) {
        return void res.status(400).send(`Verification failed: ${result.status}`);
      }

      const compatibilityDate = req.headers['x-compatibility-date'];
      if (compatibilityDate !== getCompatibility()) {
        return void res.status(400).send('Incompatible compatibility date');
      }

      res.status(204).end();

      if (!result.payloadJson?.type || !String(result.payloadJson.type).startsWith('fsb:event:')) {
        console.warn(`Received a correctly signed but unsupported payload.`);
        console.log(result.payloadJson);
        return;
      }

      emit(parseEvent(result.payloadJson));
    });
  };
}

/** Let us create an express server for you and already register everything you need. */
export function createExpressServer(options: VerifierOptions & { port?: number, route?: string, debug?: boolean }) {
  const handler = createExpressHandler(options.publicKey, options);
  const app = express();
  if (options.route) {
    app.use(options.route, handler);
  } else {
    app.use(handler);
  }
  const { promise, resolve } = Promise.withResolvers<{ app: typeof app, port: number }>();
  const port = options.port ?? 3000;
  app.listen(port, () => resolve({ app, port }));
  return promise;
}