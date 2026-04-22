import { version as packageVersion } from '../package.json' with { type: 'json' };

export const getCompatibility = () => '2026-04-01';
export const getUa = () => `fsb-ts-sdk/${packageVersion ?? 'unknown'} (https://docs.freestuffbot.xyz/libraries/node/)`;
