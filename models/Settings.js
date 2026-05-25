const { mongoose } = require('../lib/db.js');

const SettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'global' },
    promptDurationSec: { type: Number, default: 60 },
    votingDurationSec: { type: Number, default: 15 },
    tiebreakDurationSec: { type: Number, default: 10 },
    resultDurationSec: { type: Number, default: 15 },
    vsIntroDurationSec: { type: Number, default: 5 },
    theme: { type: String, default: 'a single futuristic cyberpunk cat with neon lights' },
    winnerMode: {
      type: String,
      enum: ['AI_SCORE', 'AUDIENCE_VOTE'],
      default: 'AI_SCORE'
    },
    showLivePrompts: { type: Boolean, default: true },
    stageLanguage: { type: String, enum: ['tr', 'en'], default: 'tr' },
    stageTheme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false, versionKey: false }
);

const Settings =
  mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

const DEFAULTS = {
  _id: 'global',
  promptDurationSec: 60,
  votingDurationSec: 15,
  tiebreakDurationSec: 10,
  resultDurationSec: 15,
  vsIntroDurationSec: 5,
  theme: 'a single futuristic cyberpunk cat with neon lights',
  winnerMode: 'AI_SCORE',
  showLivePrompts: true,
  stageLanguage: 'tr',
  stageTheme: 'dark'
};

async function loadSettings() {
  try {
    const doc = await Settings.findById('global').lean();
    if (doc) return { ...DEFAULTS, ...doc };
    await Settings.create(DEFAULTS);
    return DEFAULTS;
  } catch (err) {
    console.warn('[settings] load failed, using defaults:', err.message);
    return DEFAULTS;
  }
}

async function saveSettings(patch) {
  const allowed = [
    'promptDurationSec',
    'votingDurationSec',
    'tiebreakDurationSec',
    'resultDurationSec',
    'vsIntroDurationSec',
    'theme',
    'winnerMode',
    'showLivePrompts',
    'stageLanguage',
    'stageTheme'
  ];
  const clean = {};
  for (const k of allowed) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  clean.updatedAt = new Date();
  const doc = await Settings.findByIdAndUpdate('global', clean, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  }).lean();
  return { ...DEFAULTS, ...doc };
}

module.exports = { Settings, loadSettings, saveSettings, DEFAULTS };
