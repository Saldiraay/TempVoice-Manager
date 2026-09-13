import { model, Schema } from 'mongoose';

const roomPresetSchema = new Schema({
  guildId: { type: String, required: true },
  ownerId: { type: String, required: true },
  roomName: { type: String, default: '' },
  userLimit: { type: Number, default: 0 },
  privacy: { type: Boolean, default: false },
  waitingRoom: { type: Boolean, default: false },
  chat: { type: Boolean, default: true },
  trusted: { type: [String], default: [] },
  blocked: { type: [String], default: [] }
}, { timestamps: true });
roomPresetSchema.index({ guildId: 1, ownerId: 1 }, { unique: true });

const guildConfigSchema = new Schema({
  guildId: { type: String, unique: true, required: true },
  categoryId: { type: String, required: true },
  controlChannelId: { type: String, required: true },
  triggerChannelId: { type: String, required: true }
});

const activeRoomSchema = new Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, unique: true, required: true },
  ownerId: { type: String, required: true }
});
activeRoomSchema.index({ guildId: 1, ownerId: 1 }, { unique: true });

export const RoomPreset = model('RoomPreset', roomPresetSchema);
export const GuildConfig = model('GuildConfig', guildConfigSchema);
export const ActiveRoom = model('ActiveRoom', activeRoomSchema);
