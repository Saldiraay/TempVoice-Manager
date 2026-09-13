import { ActionRowBuilder, Interaction, UserSelectMenuBuilder } from 'discord.js';
import { executeVoice } from '../commands/voice.js';
import { findOwnerRoom, getPreset, roomModal } from '../services/room-service.js';
import { ActiveRoom } from '../models.js';

export async function handleInteraction(interaction: Interaction) {
  if (interaction.isChatInputCommand()) return;
  if (interaction.isButton() && interaction.customId.startsWith('room:')) {
    const action = interaction.customId.replace('room:', '');
    if (['name', 'limit'].includes(action)) {
      const fields: Record<string, [string, string, string]> = { name: ['Oda adını değiştir', 'Yeni oda adı', 'Oda adı'], limit: ['Kullanıcı limiti', 'Limit (0-99)', '0 sınırsız'] };
      const [title, label, placeholder] = fields[action]; return interaction.showModal(roomModal(action, title, label, placeholder));
    }
    if (['trust', 'untrust', 'block', 'unblock', 'kick', 'transfer'].includes(action)) {
      const selector = new UserSelectMenuBuilder()
        .setCustomId(`room-user:${action}`)
        .setPlaceholder('İşlem yapılacak kullanıcıyı seç')
        .setMinValues(1)
        .setMaxValues(1);
      return interaction.reply({ components: [new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(selector)], ephemeral: true });
    }
    const found = await findOwnerRoom(interaction);
    if (!found) return interaction.reply({ content: 'Önce kendi geçici ses kanalına girmen gerekiyor.', ephemeral: true });
    const p = await getPreset(interaction.guild!.id, found.ownerId);
    if (['privacy', 'waiting', 'chat'].includes(action)) { const key = action === 'privacy' ? 'privacy' : action === 'waiting' ? 'waitingRoom' : 'chat'; const next = !p.get(key); p.set(key, next); await found.channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, action === 'chat' ? { SendMessages: next } : { Connect: !next }); await p.save(); return interaction.reply({ content: `${action} ayarı ${next ? 'açıldı' : 'kapatıldı'}.`, ephemeral: true }); }
    if (action === 'claim') { const active = await ActiveRoom.findOne({ channelId: found.channel.id }); if (active) { active.ownerId = interaction.user.id; await active.save(); } return interaction.reply({ content: 'Oda sahiplenildi.', ephemeral: true }); }
    if (action === 'delete') { await ActiveRoom.deleteOne({ channelId: found.channel.id }); await found.channel.delete('Sahip tarafından silindi'); return; }
  }
  if (interaction.isUserSelectMenu() && interaction.customId.startsWith('room-user:')) {
    const action = interaction.customId.replace('room-user:', '');
    return executeUserAction(interaction, action, interaction.users.first()!);
  }
  if (interaction.isModalSubmit() && interaction.customId.startsWith('room-modal:')) {
    const action = interaction.customId.replace('room-modal:', '');
    return executeModal(interaction, action);
  }
}

async function executeModal(interaction: any, action: string) {
  const found = await findOwnerRoom(interaction); if (!found) return interaction.reply({ content: 'Aktif odanın sahibi değilsin.', ephemeral: true });
  const value = interaction.fields.getTextInputValue('value').trim(); const p = await getPreset(interaction.guild.id, found.ownerId);
  if (action === 'name') { await found.channel.setName(value.slice(0, 100)); p.roomName = value.slice(0, 100); }
  else if (action === 'limit') { const limit = Number(value); if (!Number.isInteger(limit) || limit < 0 || limit > 99) return interaction.reply({ content: 'Limit 0 ile 99 arasında olmalı.', ephemeral: true }); await found.channel.setUserLimit(limit); p.userLimit = limit; }
  await p.save(); return interaction.reply({ content: 'İşlem uygulandı ve kaydedildi.', ephemeral: true });
}

async function executeUserAction(interaction: any, action: string, user: any) {
  const found = await findOwnerRoom(interaction); if (!found) return interaction.update({ content: 'Aktif odanın sahibi değilsin.', components: [] });
  const p = await getPreset(interaction.guild.id, found.ownerId);
  let message = `${user.username} için işlem tamamlandı.`;
  if (action === 'trust') { if (!p.trusted.includes(user.id)) p.trusted.push(user.id); await found.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, Connect: true, Speak: true }); message = `${user.username} odaya güvenilir kullanıcı olarak eklendi.`; }
  else if (action === 'untrust') { p.trusted = p.trusted.filter((id: string) => id !== user.id); await found.channel.permissionOverwrites.delete(user.id); message = `${user.username} kullanıcısının güvenilir erişimi kaldırıldı.`; }
  else if (action === 'block') { if (!p.blocked.includes(user.id)) p.blocked.push(user.id); await found.channel.permissionOverwrites.edit(user.id, { ViewChannel: false, Connect: false }); message = `${user.username} kullanıcısı odadan engellendi.`; }
  else if (action === 'unblock') { p.blocked = p.blocked.filter((id: string) => id !== user.id); await found.channel.permissionOverwrites.delete(user.id); message = `${user.username} kullanıcısının oda engeli kaldırıldı.`; }
  else if (action === 'transfer') { const active = await ActiveRoom.findOne({ channelId: found.channel.id }); if (active) { active.ownerId = user.id; await active.save(); } message = `Oda sahipliği ${user.username} kullanıcısına devredildi.`; }
  else if (action === 'kick') { const member = await interaction.guild.members.fetch(user.id).catch(() => null); if (member?.voice.channelId === found.channel.id) { await member.voice.disconnect('Oda sahibi tarafından atıldı'); message = `${user.username} odadan çıkarıldı.`; } else message = `${user.username} şu anda bu odada bulunmuyor.`; }
  await p.save();
  const trusted = await formatUsers(interaction, p.trusted);
  const blocked = await formatUsers(interaction, p.blocked);
  await interaction.update({ content: `${message}\n\n**Güvenilir kullanıcılar:** ${trusted}\n**Engelli kullanıcılar:** ${blocked}`, components: [] });
  setTimeout(() => void interaction.deleteReply().catch(() => null), 1800);
}

async function formatUsers(interaction: any, ids: string[]) {
  if (!ids.length) return 'Yok';
  const names = await Promise.all(ids.map(async id => {
    const user = await interaction.client.users.fetch(id).catch(() => null);
    return user ? `**${user.username}**` : `<@${id}>`;
  }));
  return names.join(', ');
}
