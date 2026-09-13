import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ActiveRoom } from '../models.js';
import { findOwnerRoom, getPreset } from '../services/room-service.js';

const userOption = (command: any, description: string) => command.addUserOption((option: any) => option.setName('kullanici').setDescription(description).setRequired(true));

export const voiceCommand = new SlashCommandBuilder().setName('voice').setDescription('Özel odanı yönetir')
  .addSubcommand(c => c.setName('name').setDescription('Oda adını değiştirir').addStringOption(o => o.setName('ad').setDescription('Yeni oda adı').setRequired(true)))
  .addSubcommand(c => c.setName('limit').setDescription('Oda limitini değiştirir').addIntegerOption(o => o.setName('sayi').setDescription('0-99 arası limit').setMinValue(0).setMaxValue(99).setRequired(true)))
  .addSubcommand(c => c.setName('privacy').setDescription('Gizliliği açar veya kapatır'))
  .addSubcommand(c => c.setName('waiting').setDescription('Bekleme ayarını açar veya kapatır'))
  .addSubcommand(c => c.setName('chat').setDescription('Oda sohbetini açar veya kapatır'))
  .addSubcommand(c => userOption(c.setName('invite').setDescription('Kullanıcıyı davet eder'), 'Davet edilecek kullanıcı'))
  .addSubcommand(c => userOption(c.setName('kick').setDescription('Kullanıcıyı atar'), 'Atılacak kullanıcı'))
  .addSubcommand(c => c.setName('claim').setDescription('Odayı sahiplenir'))
  .addSubcommand(c => userOption(c.setName('transfer').setDescription('Odayı devreder'), 'Yeni oda sahibi'))
  .addSubcommandGroup(g => g.setName('trust').setDescription('Güven listesini yönetir')
    .addSubcommand(c => userOption(c.setName('add').setDescription('Kullanıcıya güven verir'), 'Güvenilecek kullanıcı'))
    .addSubcommand(c => userOption(c.setName('remove').setDescription('Güveni kaldırır'), 'Kullanıcı')))
  .addSubcommandGroup(g => g.setName('block').setDescription('Engel listesini yönetir')
    .addSubcommand(c => userOption(c.setName('add').setDescription('Kullanıcıyı engeller'), 'Engellenecek kullanıcı'))
    .addSubcommand(c => userOption(c.setName('remove').setDescription('Engeli kaldırır'), 'Kullanıcı')))
  .addSubcommand(c => c.setName('delete').setDescription('Özel odayı siler'));

export async function executeVoice(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return interaction.reply({ content: 'Bu komut yalnızca sunucuda kullanılabilir.', ephemeral: true });
  const found = await findOwnerRoom(interaction);
  if (!found) return interaction.reply({ content: 'Önce kendi geçici ses kanalına girmen gerekiyor.', ephemeral: true });
  const subcommand = interaction.options.getSubcommand();
  const group = interaction.options.getSubcommandGroup(false);
  const p = await getPreset(interaction.guild.id, found.ownerId);
  const target = interaction.options.getUser('kullanici');
  if (subcommand === 'name') { const value = interaction.options.getString('ad', true).slice(0, 100); await found.channel.setName(value); p.roomName = value; }
  else if (subcommand === 'limit') { const value = interaction.options.getInteger('sayi', true); await found.channel.setUserLimit(value); p.userLimit = value; }
  else if (subcommand === 'privacy' || subcommand === 'waiting' || subcommand === 'chat') { const next = !(p.get(subcommand === 'privacy' ? 'privacy' : subcommand === 'waiting' ? 'waitingRoom' : 'chat')); p.set(subcommand === 'privacy' ? 'privacy' : subcommand === 'waiting' ? 'waitingRoom' : 'chat', next); await found.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, subcommand === 'chat' ? { SendMessages: next } : { Connect: !next }); await p.save(); return interaction.reply({ content: `${subcommand} ayarı ${next ? 'açıldı' : 'kapatıldı'}.`, ephemeral: true }); }
  else if (subcommand === 'invite' || (subcommand === 'add' && group === 'trust')) { if (!target) return interaction.reply({ content: 'Bir kullanıcı seçmelisin.', ephemeral: true }); if (!p.trusted.includes(target.id)) p.trusted.push(target.id); await found.channel.permissionOverwrites.edit(target.id, { ViewChannel: true, Connect: true, Speak: true }); return temporaryResult(interaction, p, `${target.username} odaya güvenilir kullanıcı olarak eklendi.`); }
  else if (subcommand === 'kick') { if (!target) return interaction.reply({ content: 'Bir kullanıcı seçmelisin.', ephemeral: true }); const member = await interaction.guild.members.fetch(target.id).catch(() => null); if (member?.voice.channelId === found.channel.id) { await member.voice.disconnect('Oda sahibi tarafından atıldı'); return temporaryResult(interaction, p, `${target.username} odadan çıkarıldı.`); } return temporaryResult(interaction, p, `${target.username} şu anda bu odada bulunmuyor.`); }
  else if (subcommand === 'remove' && group === 'trust') { if (!target) return interaction.reply({ content: 'Bir kullanıcı seçmelisin.', ephemeral: true }); p.trusted = p.trusted.filter((id: string) => id !== target.id); await found.channel.permissionOverwrites.delete(target.id); return temporaryResult(interaction, p, `${target.username} kullanıcısının güvenilir erişimi kaldırıldı.`); }
  else if (subcommand === 'add' && group === 'block') { if (!target) return interaction.reply({ content: 'Bir kullanıcı seçmelisin.', ephemeral: true }); if (!p.blocked.includes(target.id)) p.blocked.push(target.id); await found.channel.permissionOverwrites.edit(target.id, { ViewChannel: false, Connect: false }); return temporaryResult(interaction, p, `${target.username} kullanıcısı odadan engellendi.`); }
  else if (subcommand === 'remove' && group === 'block') { if (!target) return interaction.reply({ content: 'Bir kullanıcı seçmelisin.', ephemeral: true }); p.blocked = p.blocked.filter((id: string) => id !== target.id); await found.channel.permissionOverwrites.delete(target.id); return temporaryResult(interaction, p, `${target.username} kullanıcısının engeli kaldırıldı.`); }
  else if (subcommand === 'transfer') { if (!target) return interaction.reply({ content: 'Yeni sahibini seçmelisin.', ephemeral: true }); const active = await ActiveRoom.findOne({ channelId: found.channel.id }); if (active) { active.ownerId = target.id; await active.save(); } }
  else if (subcommand === 'claim') { const active = await ActiveRoom.findOne({ channelId: found.channel.id }); if (active) { active.ownerId = interaction.user.id; await active.save(); } }
  else if (subcommand === 'delete') { await ActiveRoom.deleteOne({ channelId: found.channel.id }); await found.channel.delete('Oda sahibi tarafından silindi'); return interaction.reply({ content: 'Oda silindi.', ephemeral: true }); }
  await p.save();
  return interaction.reply({ content: 'İşlem uygulandı ve tercihin kaydedildi.', ephemeral: true });
}

async function temporaryResult(interaction: ChatInputCommandInteraction, preset: any, message: string) {
  await preset.save();
  const guild = interaction.guild!;
  const resolve = async (ids: string[]) => ids.length ? (await Promise.all(ids.map(id => guild.client.users.fetch(id).catch(() => null)))).filter(Boolean).map(user => `**${user!.username}**`).join(', ') || 'Yok' : 'Yok';
  await interaction.reply({ content: `${message}\n\n**Güvenilir kullanıcılar:** ${await resolve(preset.trusted)}\n**Engelli kullanıcılar:** ${await resolve(preset.blocked)}`, ephemeral: true });
  setTimeout(() => void interaction.deleteReply().catch(() => null), 1800);
}
