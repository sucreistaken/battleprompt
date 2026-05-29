// Depolama provider seçici.
// STORAGE_PROVIDER=local (default, disk) | gcs

const PROVIDER = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

let impl;
if (PROVIDER === 'gcs') {
  impl = require('./gcs.js');
} else {
  impl = require('./storage/local.js');
}

module.exports = { uploadBuffer: impl.uploadBuffer, provider: PROVIDER };
