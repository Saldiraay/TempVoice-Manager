import {
  ActionRowBuilder, Guild, GuildMember, Interaction, ModalBuilder, OverwriteResolvable,
  PermissionFlagsBits, TextChannel, TextInputBuilder, TextInputStyle, VoiceChannel, ChannelType
} from 'discord.js';
import { ActiveRoom, GuildConfig, RoomPreset } from '../models.js';
import { panelImage, panelRows } from '../panel.js';

export async function getPreset(guildId: string, ownerId: string) {
  return RoomPreset.findOneAndUpdate({ guildId, ownerId }, {}, { upsert: true, new: true, setDefaultsOnInsert: true });
}

export async function findOwnerRoom(interaction: Interaction): Promise<{ channel: VoiceChannel; ownerId: string } | null> {
  if (!interaction.guild || !interaction.member || !('voice' in interaction.member)) return null;
  const member = interaction.member as GuildMember;
  const room = await ActiveRoom.findOne({ guildId: interaction.guild.id, ownerId: member.id });
  if (!room) return null;
  const channel = interaction.guild.channels.cache.get(room.channelId);
  return channel?.type === ChannelType.GuildVoice ? { channel, ownerId: room.ownerId } : null;
}

export async function setupGuild(guild: Guild, channel: TextChannel) {
  const old = await GuildConfig.findOne({ guildId: guild.id });
  if (old) {
    const [category, control, trigger] = await Promise.all([
      guild.channels.fetch(old.categoryId).catch(() => null),
      guild.channels.fetch(old.controlChannelId).catch(() => null),
      guild.channels.fetch(old.triggerChannelId).catch(() => null)
    ]);
    if (category?.type === ChannelType.GuildCategory && control?.type === ChannelType.GuildText && trigger?.type === ChannelType.GuildVoice) {
      return channel.send(`Bu sunucuda kurulum zaten yapılmış. Mevcut yönetim kanalı: <#${old.controlChannelId}>`);
    }
    await GuildConfig.deleteOne({ _id: old._id });
  }
  const category = await guild.channels.create({ name: 'ÖZEL ODALAR', type: ChannelType.GuildCategory });
  const control = await guild.channels.create({ name: 'özel-odanı-yönet', type: ChannelType.GuildText, parent: category.id });
  const trigger = await guild.channels.create({ name: 'Ozel Oda Oluştur', type: ChannelType.GuildVoice, parent: category.id });
  await GuildConfig.create({ guildId: guild.id, categoryId: category.id, controlChannelId: control.id, triggerChannelId: trigger.id });
  await control.send({ files: [{ attachment: await panelImage(guild), name: 'ozel-oda-panel.png' }], components: await panelRows(guild) });
  return channel.send(`Kurulum tamamlandı. Yönetim: <#${control.id}> | Oda oluşturma: <#${trigger.id}>`);
}

export async function clearDeletedGuildConfig(channelId: string) {
  await GuildConfig.deleteOne({
    $or: [{ categoryId: channelId }, { controlChannelId: channelId }, { triggerChannelId: channelId }]
  });
}

export function roomModal(id: string, title: string, label: string, placeholder: string) {
  return new ModalBuilder().setCustomId(`room-modal:${id}`).setTitle(title).addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('value').setLabel(label).setPlaceholder(placeholder).setStyle(TextInputStyle.Short).setRequired(true)));
}

export async function createRoom(member: GuildMember, configDoc: { categoryId: string }) {
  const p = await getPreset(member.guild.id, member.id);
  const overwrites: OverwriteResolvable[] = [
    { id: member.guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
    { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.ManageChannels] }
  ];
  const channel = await member.guild.channels.create({ name: p.roomName || `${member.displayName}'nın Odası`, type: ChannelType.GuildVoice, parent: configDoc.categoryId, userLimit: p.userLimit, permissionOverwrites: overwrites });
  await ActiveRoom.create({ guildId: member.guild.id, channelId: channel.id, ownerId: member.id });
  await member.voice.setChannel(channel);
}

export async function removeEmptyRoom(guild: Guild, channelId: string) {
  const active = await ActiveRoom.findOne({ channelId });
  if (!active) return;
  const channel = guild.channels.cache.get(channelId);
  if (channel?.isVoiceBased() && channel.members.size === 0) {
    await ActiveRoom.deleteOne({ channelId });
    await channel.delete('Oda boş kaldı');
  }
}
