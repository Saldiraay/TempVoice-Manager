import mongoose from 'mongoose';
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { registerEvents } from './handlers/event-handler.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers] });

registerEvents(client);

await mongoose.connect(config.mongoUri);
await client.login(config.token);
