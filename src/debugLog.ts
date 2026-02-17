/**
 * Debug instrumentation — remove after bug is confirmed fixed.
 */
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/eb97d294-4731-49e7-89f1-e151d63f2b25';

export function debugLog(payload: {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
}) {
  const body = { ...payload, timestamp: Date.now(), sessionId: 'debug-session' };
  console.warn('[STUDY-SESSION-DEBUG]', payload.location, payload.message, payload.data ?? {});
  fetch(DEBUG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});
}
