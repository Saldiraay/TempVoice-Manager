import { Guild } from 'discord.js';
import { GuildConfig } from '../models.js';
import { createRoom, removeEmptyRoom } from '../services/room-service.js';

export async function handleVoiceState(oldState: { guild: Guild; channelId: string | null }, newState: { guild: Guild; channelId: string | null; member: any }) {
  const config = await GuildConfig.findOne({ guildId: newState.guild.id });
  if (config && newState.channelId === config.triggerChannelId && newState.member) await createRoom(newState.member, config);
  if (oldState.channelId) await removeEmptyRoom(oldState.guild, oldState.channelId);
}
