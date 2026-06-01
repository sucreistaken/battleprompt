// REST response envelope + canonical error code taxonomy.
// Story 1.3: { ok: true, data } / { ok: false, code, message?, issues? }.
// All error codes must come from ERROR_CODES (MUST rule #4 in architecture.md).

const { z } = require('zod');

// Canonical error codes (snake_case). Add new codes here — magic strings forbidden.
const ERROR_CODES = Object.freeze({
  ROOM_FULL: 'room_full',
  ROOM_NOT_FOUND: 'room_not_found',
  ROOM_EXPIRED: 'room_expired',
  AUDIENCE_FULL: 'audience_full',
  VOTING_CLOSED: 'voting_closed',
  VOTING_DISABLED: 'voting_disabled',
  UNAUTHORIZED_HOST: 'unauthorized_host',
  UNAUTHORIZED_ADMIN: 'unauthorized_admin',
  RATE_LIMITED: 'rate_limited',
  INVALID_INPUT: 'invalid_input',
  ROOM_CREATE_LIMIT: 'room_create_limit',
  GENERATION_FAILED: 'generation_failed',
  MONGO_UNAVAILABLE: 'mongo_unavailable',
  STALE_ACTION: 'stale_action', // G-7 (Story 2.9)
  ALREADY_VOTED: 'already_voted', // Story 3.2
  INTERNAL: 'internal'
});

const STATUS_BY_CODE = Object.freeze({
  [ERROR_CODES.INVALID_INPUT]: 400,
  [ERROR_CODES.UNAUTHORIZED_HOST]: 401,
  [ERROR_CODES.UNAUTHORIZED_ADMIN]: 401,
  [ERROR_CODES.ROOM_NOT_FOUND]: 404,
  [ERROR_CODES.ROOM_EXPIRED]: 410,
  [ERROR_CODES.ROOM_FULL]: 409,
  [ERROR_CODES.AUDIENCE_FULL]: 409,
  [ERROR_CODES.VOTING_CLOSED]: 409,
  [ERROR_CODES.VOTING_DISABLED]: 409,
  [ERROR_CODES.ALREADY_VOTED]: 409,
  [ERROR_CODES.STALE_ACTION]: 409,
  [ERROR_CODES.RATE_LIMITED]: 429,
  [ERROR_CODES.ROOM_CREATE_LIMIT]: 429,
  [ERROR_CODES.GENERATION_FAILED]: 500,
  [ERROR_CODES.MONGO_UNAVAILABLE]: 500,
  [ERROR_CODES.INTERNAL]: 500
});

function _statusFor(code) {
  return STATUS_BY_CODE[code] || 500;
}

function _isKnownCode(code) {
  return Object.prototype.hasOwnProperty.call(STATUS_BY_CODE, code);
}

// Build a Next.js-friendly response payload. Caller does the wrapping
// (NextResponse.json(payload, { status })) so this stays framework-agnostic.
function apiOk(data) {
  return { status: 200, body: { ok: true, data } };
}

// apiError accepts:
//   - a string code (one of ERROR_CODES values)
//   - a ZodError-like object (instance of z.ZodError) → invalid_input + issues
//   - { code, message?, issues?, status? } object
//   - an Error instance with .code set → maps if known, else internal
function apiError(err) {
  // ZodError (validation boundary)
  if (err && err instanceof z.ZodError) {
    return {
      status: 400,
      body: {
        ok: false,
        code: ERROR_CODES.INVALID_INPUT,
        issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
      }
    };
  }
  // Bare string code
  if (typeof err === 'string') {
    const code = _isKnownCode(err) ? err : ERROR_CODES.INTERNAL;
    return { status: _statusFor(code), body: { ok: false, code } };
  }
  // { code, message?, issues?, status? }
  if (err && typeof err === 'object' && typeof err.code === 'string') {
    const code = _isKnownCode(err.code) ? err.code : ERROR_CODES.INTERNAL;
    const status = err.status || _statusFor(code);
    const body = { ok: false, code };
    if (err.message) body.message = err.message;
    if (err.issues) body.issues = err.issues;
    return { status, body };
  }
  // Unknown — 500 internal, do not leak details to the client.
  if (err instanceof Error) {
    console.error('[api] unhandled error:', err.message);
  } else if (err) {
    console.error('[api] unhandled non-Error value:', err);
  }
  return { status: 500, body: { ok: false, code: ERROR_CODES.INTERNAL } };
}

// Typed error class so handlers can `throw new ApiError(code, message?)`
// without constructing payloads inline.
class ApiError extends Error {
  constructor(code, message, extra) {
    super(message || code);
    this.code = code;
    if (extra && extra.issues) this.issues = extra.issues;
    if (extra && extra.status) this.status = extra.status;
  }
}

module.exports = {
  ERROR_CODES,
  STATUS_BY_CODE,
  apiOk,
  apiError,
  ApiError
};
