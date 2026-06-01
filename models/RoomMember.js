// RoomMember model — fire-and-forget. Story 1.6.
// One row per role attachment to a room (HOST / PLAYER / AUDIENCE). HOST row
// is created at room create; PLAYER rows at /join; AUDIENCE rows at /watch.

const { mongoose } = require('../lib/db.js');

const ROLES = ['HOST', 'PLAYER', 'AUDIENCE'];
const STATUSES = ['ACTIVE', 'DISCONNECTED', 'LEFT'];

const RoomMemberSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: String }, // hostId for HOST; deviceId-derived for PLAYER
    sessionId: { type: String },
    nickname: { type: String, default: '' },
    role: { type: String, enum: ROLES, required: true },
    slot: { type: String, enum: ['A', 'B', null], default: null },
    status: { type: String, enum: STATUSES, default: 'ACTIVE' },
    joinedAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// Single occupant per (roomId, slot) when slot is set (PLAYER rows only).
RoomMemberSchema.index(
  { roomId: 1, slot: 1 },
  {
    unique: true,
    partialFilterExpression: { slot: { $in: ['A', 'B'] } }
  }
);

RoomMemberSchema.index({ roomId: 1, role: 1 });

const RoomMember = mongoose.models.RoomMember || mongoose.model('RoomMember', RoomMemberSchema);

async function saveRoomMember(doc) {
  try {
    return await RoomMember.create(doc);
  } catch (err) {
    console.warn('[roomMember] mongo save failed:', err.message);
    return null;
  }
}

module.exports = { RoomMember, ROLES, STATUSES, saveRoomMember };
