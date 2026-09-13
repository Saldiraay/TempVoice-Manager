import { ChatInputCommandInteraction, REST, Routes } from 'discord.js';
import { config } from '../config.js';
import { setupCommand, executeSetup } from '../commands/setup.js';
import { voiceCommand, executeVoice } from '../commands/voice.js';

const commands = [
  { definition: setupCommand, execute: executeSetup },
  { definition: voiceCommand, execute: executeVoice }
];

export async function handleCommand(interaction: ChatInputCommandInteraction) {
  const command = commands.find(({ definition }) => definition.name === interaction.commandName);
  if (command) return command.execute(interaction);
}

export async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(config.token);
  const body = commands.map(({ definition }) => definition.toJSON());
  const route = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);

  await rest.put(route, { body });
  console.log('Slash komutları kaydedildi.');
}