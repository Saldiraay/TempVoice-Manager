import { Client } from 'discord.js';
import { handleInteraction } from './interaction-handler.js';
import { handleCommand } from './command-handler.js';
import { handleVoiceState } from '../events/voice-state.js';
import { clearDeletedGuildConfig } from '../services/room-service.js';

export function registerEvents(client: Client) {
  client.once('ready', () => console.log(`${client.user?.tag} hazır.`));

  client.on('interactionCreate', async interaction => {
    try {
      if (interaction.isChatInputCommand()) return await handleCommand(interaction);
      return await handleInteraction(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.isRepliable() && !interaction.replied) {
        await interaction.reply({ content: 'İşlem sırasında bir hata oluştu.', ephemeral: true });
      }
    }
  });

  client.on('voiceStateUpdate', (oldState, newState) => {
    void handleVoiceState(oldState, newState).catch(console.error);
  });

  client.on('channelDelete', channel => {
    void clearDeletedGuildConfig(channel.id).catch(console.error);
  });
}