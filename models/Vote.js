const { mongoose } = require('../lib/db.js');

const VoteSchema = new mongoose.Schema(
  {
    matchId: String,
    deviceId: String,
    votedFor: { type: String, enum: ['A', 'B'] },
    phase: { type: String, enum: ['MAIN', 'TIEBREAK'], default: 'MAIN' },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

VoteSchema.index({ matchId: 1, deviceId: 1, phase: 1 }, { unique: true });

const Vote = mongoose.models.Vote || mongoose.model('Vote', VoteSchema);

async function recordVote({ matchId, deviceId, votedFor, phase }) {
  try {
    await Vote.create({ matchId, deviceId, votedFor, phase });
    return true;
  } catch (err) {
    if (err && err.code === 11000) return false; // duplicate
    console.warn('[vote] insert failed:', err.message);
    return false;
  }
}

module.exports = { Vote, recordVote };
