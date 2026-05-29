const { mongoose } = require('../lib/db.js');

const PlayerSubSchema = new mongoose.Schema(
  {
    nickname: String,
    prompt: String,
    imageUrl: String,
    aiScore: Number,
    voteCount: Number,
    forfeit: { type: Boolean, default: false }
  },
  { _id: false }
);

const MatchSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    targetPrompt: String,
    category: String,
    difficulty: String,
    referenceImageUrl: String,
    winnerMode: { type: String, enum: ['AI_SCORE', 'AUDIENCE_VOTE'] },
    playerA: PlayerSubSchema,
    playerB: PlayerSubSchema,
    winner: { type: String, enum: ['A', 'B', 'TIE'] },
    tiebreakUsed: { type: Boolean, default: false }
  },
  { versionKey: false }
);

MatchSchema.index({ startedAt: -1 });

const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

async function saveMatch(record) {
  try {
    const doc = await Match.create(record);
    return doc._id.toString();
  } catch (err) {
    console.warn('[match] save failed:', err.message);
    return null;
  }
}

async function recentMatches(limit = 20) {
  return Match.find({})
    .sort({ startedAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = { Match, saveMatch, recentMatches };
