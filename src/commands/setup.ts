import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, ChannelType, TextChannel } from 'discord.js';
import { setupGuild } from '../services/room-service.js';

export const setupCommand = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Özel oda sistemini bu sunucuya kurar')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function executeSetup(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || interaction.channel?.type !== ChannelType.GuildText) return interaction.reply({ content: 'Bu komut bir sunucu metin kanalında kullanılmalı.', ephemeral: true });
  await interaction.reply({ content: 'Özel oda sistemi kuruluyor...', ephemeral: true });
  return setupGuild(interaction.guild, interaction.channel as TextChannel);
}
