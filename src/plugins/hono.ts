import { getCompatibility, getUa } from '../const' with { type: 'macro' };

import { createFactory } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { KeyObject } from 'node:crypto';
import { newSignedMessageVerifier, type VerifierOptions } from '../verifier';
import { emit } from '../events';
import { parseEvent } from '../parser';
import { Context } from 'hono/dist/types/context'
import { Env } from 'hono/types'


type HonoOptions = Partial<Omit<VerifierOptions, 'publicKey'> & { debug?: boolean; }>

type PubkeyFactory<HonoE extends Env = Env> = (c: Context<HonoE, string, {}>) => Promise<string | KeyObject>;
type PubkeyOrFactory<HonoE extends Env = Env> = string | KeyObject | PubkeyFactory<HonoE>;

export function createHonoHandler<HonoE extends Env = Env>(pubkey: PubkeyOrFactory<HonoE>, options?: HonoOptions) {
  const factory = createFactory<HonoE>();
  const verifier = typeof pubkey === 'function'
    ? null
    : newSignedMessageVerifier({
        publicKey: pubkey,
        ...(options ?? {}),
      });

  return factory.createHandlers(async (c) => {
    c.header('X-Set-Compatibility-Date', getCompatibility());
    c.header('X-Client-Library', getUa());

    const body = await c.req.arrayBuffer()
      .then((ab) => Buffer.from(ab))
      .catch((e) => {
        throw new HTTPException(500, { message: 'Error parsing request body' });
      });

    if (!body) {
      throw new HTTPException(400, { message: 'Missing body' });
    }

    if (!Buffer.isBuffer(body)) {
      throw new HTTPException(500, { message: 'Invalid server configuration' });
    }

    const localVerifier = verifier ?? newSignedMessageVerifier({
      publicKey: await (pubkey as PubkeyFactory<HonoE>)(c),
      ...(options ?? {}),
    });

    const result = localVerifier({
      data: body,
      signature: String(c.req.header('webhook-signature')),
      messageId: String(c.req.header('webhook-id')),
      timestamp: String(c.req.header('webhook-timestamp')),
    });

    if (options?.debug) {
      console.log('in>', {
        data: body,
        signature: String(c.req.header('webhook-signature')),
        messageId: String(c.req.header('webhook-id')),
        timestamp: String(c.req.header('webhook-timestamp')),
      });
      console.log('out>', result);
    }

    if (!result.success) {
      throw new HTTPException(400, { message: `Verification failed: ${result.status}` });
    }

    const compatibilityDate = c.req.header('x-compatibility-date');
    if (compatibilityDate !== getCompatibility()) {
      throw new HTTPException(400, { message: 'Incompatible compatibility date' });
    }

    if (!result.payloadJson) {
      throw new HTTPException(400, { message: 'Missing payload JSON' });
    }

    const event = parseEvent(result.payloadJson);
    ;(event as any).$hono = c;
    emit(event);

    return c.newResponse(null, 204);
  })
}
