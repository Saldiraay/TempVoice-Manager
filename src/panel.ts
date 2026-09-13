import { Resvg } from '@resvg/resvg-js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Guild, GuildEmoji } from 'discord.js';

const fallbackIcons: Record<string, string> = { name: '✏️', limit: '👥', kick: '🔨', privacy: '🔒', trust: '👤', untrust: '👤', block: '🚫', unblock: '✅', claim: '👑', delete: '🗑️' };

const iconSvgs: Record<string, string> = {
  name: '<path d="M18 22h28M18 42h28M27 16v12M37 36v12" fill="none" stroke="#f7f9fc" stroke-width="3"/><circle cx="27" cy="22" r="4" fill="#e8edf3"/><circle cx="37" cy="42" r="4" fill="#e8edf3"/>',
  limit: '<circle cx="32" cy="23" r="7" fill="none" stroke="#f7f9fc" stroke-width="3"/><path d="M18 51c1-9 6-14 14-14s13 5 14 14M13 31c-4 2-6 6-6 11M51 31c4 2 6 6 6 11" fill="none" stroke="#f7f9fc" stroke-width="3"/>',
  kick: '<path d="M19 18h26l-3 38H22zM16 18h32M26 18v-6h12v6M28 28v18M36 28v18" fill="none" stroke="#f7f9fc" stroke-width="3"/>',
  privacy: '<path d="M32 10 51 18v13c0 13-8 21-19 25C21 52 13 44 13 31V18z" fill="none" stroke="#f7f9fc" stroke-width="3"/><path d="M24 30h16M32 24v12" fill="none" stroke="#e8edf3" stroke-width="3"/>',
  trust: '<circle cx="30" cy="23" r="8" fill="none" stroke="#f7f9fc" stroke-width="3"/><path d="M15 52c1-10 6-15 15-15s14 5 15 15" fill="none" stroke="#f7f9fc" stroke-width="3"/><circle cx="51" cy="45" r="8" fill="#303943" stroke="#6ee49a" stroke-width="3"/><path d="m47 45 3 3 6-7" fill="none" stroke="#6ee49a" stroke-width="3"/>',
  untrust: '<circle cx="30" cy="23" r="8" fill="none" stroke="#f7f9fc" stroke-width="3"/><path d="M15 52c1-10 6-15 15-15s14 5 15 15" fill="none" stroke="#f7f9fc" stroke-width="3"/><circle cx="51" cy="45" r="8" fill="#303943" stroke="#ff8181" stroke-width="3"/><path d="m47 41 8 8M55 41l-8 8" fill="none" stroke="#ff8181" stroke-width="3"/>',
  block: '<circle cx="32" cy="32" r="22" fill="none" stroke="#f7f9fc" stroke-width="3"/><path d="m17 17 30 30" fill="none" stroke="#ff8181" stroke-width="4"/>',
  unblock: '<circle cx="32" cy="32" r="22" fill="none" stroke="#f7f9fc" stroke-width="3"/><path d="m18 32 9 9 19-20" fill="none" stroke="#6ee49a" stroke-width="4"/>',
  claim: '<circle cx="32" cy="21" r="8" fill="none" stroke="#f7f9fc" stroke-width="3"/><path d="M16 52c1-10 6-15 16-15s15 5 16 15M32 10v-5M27 8l5-5 5 5" fill="none" stroke="#f7f9fc" stroke-width="3"/>',
  delete: '<path d="M20 20h24l-3 38H23zM16 20h32M26 20v-6h12v6M28 29v20M36 29v20" fill="none" stroke="#ff8181" stroke-width="3"/>'
};

const button = (id: string, emoji: string | { id: string; name: string }, style = ButtonStyle.Secondary) =>
  new ButtonBuilder().setCustomId(`room:${id}`).setEmoji(emoji).setStyle(style);

async function createPanelEmoji(guild: Guild, name: string): Promise<GuildEmoji | null> {
  const existing = guild.emojis.cache.find(emoji => emoji.name === `voice_ui_v4_${name}`);
  if (existing) return existing;
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><clipPath id="button-clip"><circle cx="32" cy="32" r="29"/></clipPath></defs><g clip-path="url(#button-clip)" stroke-linecap="round" stroke-linejoin="round">${iconSvgs[name]}</g></svg>`;
    const buffer = Buffer.from(new Resvg(svg).render().asPng());
    return await guild.emojis.create({ attachment: buffer, name: `voice_ui_v4_${name}` });
  } catch {
    return null;
  }
}

async function panelIcons(guild: Guild) {
  await guild.emojis.fetch();
  const entries = await Promise.all(Object.keys(fallbackIcons).map(async name => [name, await createPanelEmoji(guild, name)] as const));
  return Object.fromEntries(entries.map(([name, emoji]) => [name, emoji ? { id: emoji.id, name: emoji.name ?? `voice_ui_v4_${name}` } : fallbackIcons[name]]));
}

export async function panelRows(guild: Guild) {
  const icons = await panelIcons(guild);
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(button('name', icons.name), button('limit', icons.limit), button('kick', icons.kick)),
    new ActionRowBuilder<ButtonBuilder>().addComponents(button('privacy', icons.privacy), button('trust', icons.trust), button('untrust', icons.untrust)),
    new ActionRowBuilder<ButtonBuilder>().addComponents(button('block', icons.block), button('unblock', icons.unblock), button('claim', icons.claim), button('delete', icons.delete, ButtonStyle.Danger))
  ];
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] ?? character);
}

async function getGuildIconData(guild: Guild) {
  const iconUrl = guild.iconURL({ extension: 'png', size: 128 });
  if (!iconUrl) return null;
  try {
    const response = await fetch(iconUrl);
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:image/png;base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function panelImage(guild: Guild): Promise<Buffer> {
  const cards = [
    ['name', 'Oda İsmi', 'Özel ses kanalınızın ismini', 'değiştirmenizi sağlar.'],
    ['limit', 'Oda Limiti', 'Özel ses kanalınızın limitini', 'ayarlamanızı sağlar.'],
    ['kick', 'Kullanıcı At', 'Seçtiğiniz kullanıcıyı özel ses', 'kanalınızdan çıkarır.'],
    ['privacy', 'Oda Kilidi', 'Odanın giriş çıkışını açıp', 'kapatmanızı sağlar.'],
    ['trust', 'Erişim Ekle', 'Seçtiğiniz kullanıcıya odaya', 'giriş izni verir.'],
    ['untrust', 'Erişim Kaldır', 'Seçtiğiniz kullanıcının odaya', 'erişimini kaldırır.'],
    ['block', 'Kullanıcı Engelle', 'Seçtiğiniz kullanıcının odaya', 'girişini engeller.'],
    ['unblock', 'Engeli Kaldır', 'Seçtiğiniz kullanıcının oda', 'engelini kaldırır.'],
    ['claim', 'Sahiplen', 'Boşta kalan odayı üzerinize', 'almanızı sağlar.'],
    ['delete', 'Odayı Sil', 'Özel ses kanalınızı kalıcı olarak', 'silmenizi sağlar.']
  ];
  const cardMarkup = cards.map(([iconName, title, line1, line2], index) => {
    const x = 40 + (index % 3) * 300;
    const y = 190 + Math.floor(index / 3) * 160;
    const icon = iconSvgs[iconName];
    return `<rect x="${x}" y="${y}" width="280" height="140" rx="16" fill="#121519" fill-opacity="0.96" stroke="#293039"/><rect x="${x + 1}" y="${y + 1}" width="278" height="138" rx="15" fill="none" stroke="#f28b3c" stroke-opacity=".22"/><circle cx="${x + 40}" cy="${y + 40}" r="24" fill="#0d1014" stroke="#56616e"/><circle cx="${x + 40}" cy="${y + 40}" r="20" fill="#4b5561"/><g transform="translate(${x + 24},${y + 24}) scale(.5)" clip-path="url(#icon-clip)" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${icon}</g><text x="${x + 72}" y="${y + 45}" fill="#f4f7fb" font-size="20" font-weight="700">${title}</text><text x="${x + 18}" y="${y + 84}" fill="#aeb7c2" font-size="14">${line1}</text><text x="${x + 18}" y="${y + 106}" fill="#aeb7c2" font-size="14">${line2}</text>`;
  }).join('');
  const initial = escapeXml(guild.name.trim().charAt(0).toUpperCase() || 'V');
  const iconData = await getGuildIconData(guild);
  const iconMarkup = iconData
    ? `<defs><clipPath id="server-icon"><circle cx="82" cy="72" r="40"/></clipPath></defs><circle cx="82" cy="72" r="43" fill="#ff9a3d" opacity="0.34"/><image href="${iconData}" x="42" y="32" width="80" height="80" preserveAspectRatio="xMidYMid slice" clip-path="url(#server-icon)"/><circle cx="82" cy="72" r="40" fill="none" stroke="#ffc078" stroke-width="2"/>`
    : `<circle cx="82" cy="72" r="43" fill="#ff9a3d" opacity="0.34"/><circle cx="82" cy="72" r="40" fill="#3a2113" stroke="#ffc078" stroke-width="2"/><text x="82" y="81" text-anchor="middle" fill="#ffe0b2" font-size="27" font-weight="700">${initial}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="880"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2026"/><stop offset="0.48" stop-color="#0d1014"/><stop offset="1" stop-color="#060708"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#77818d" stop-opacity="0.2"/><stop offset="0.5" stop-color="#242a31" stop-opacity="0.08"/><stop offset="1" stop-color="#d3dae2" stop-opacity="0.12"/></linearGradient><clipPath id="icon-clip"><circle cx="32" cy="32" r="21"/></clipPath><filter id="glow"><feGaussianBlur stdDeviation="8"/></filter></defs><rect width="960" height="880" rx="22" fill="url(#bg)"/><circle cx="860" cy="30" r="170" fill="#f28b3c" opacity="0.08" filter="url(#glow)"/><rect x="1" y="1" width="958" height="878" rx="22" fill="none" stroke="#424b55" stroke-width="2"/><rect x="24" y="22" width="912" height="145" rx="18" fill="url(#glass)" stroke="#59636e" stroke-opacity="0.65"/>${iconMarkup}<text x="142" y="67" fill="#f4f7fb" font-size="27" font-weight="700">Özel Ses Kanalı Paneli</text><text x="142" y="100" fill="#b8c1cb" font-size="17">Aşağıdaki ikonlarla kendi özel ses kanalını hızlıca düzenleyebilirsin.</text>${cardMarkup}</svg>`;
  return Buffer.from(new Resvg(svg).render().asPng());
}
