import { readFileSync } from 'node:fs';

type ConfigFile = {
  token: string;
  clientId: string;
  guildId?: string;
  mongoUri: string;
};

const fileConfig = JSON.parse(readFileSync(new URL('../config.json', import.meta.url), 'utf8')) as ConfigFile;

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} config.json içinde tanımlı değil.`);
  return value;
}

export const config = {
  token: required(fileConfig.token, 'token'),
  clientId: required(fileConfig.clientId, 'clientId'),
  guildId: fileConfig.guildId ?? '',
  mongoUri: required(fileConfig.mongoUri, 'mongoUri')
};
