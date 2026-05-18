import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Remove any expired Supabase session from localStorage before creating the client.
// If a stored access token is expired, Supabase _initialize() tries to refresh it
// via HTTP on startup. If that call hangs, signInWithPassword waits forever for
// initializePromise and the login button spins indefinitely.
(function pruneExpiredSession() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const session = JSON.parse(localStorage.getItem(key) ?? 'null');
        const expiresAt: number = session?.expires_at ?? 0;
        if (expiresAt < Math.floor(Date.now() / 1000)) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch { /* ignore malformed entries */ }
})();

// Bypass navigator.locks to avoid cross-tab lock contention.
const noopLock = <R>(_name: string, _timeout: number, fn: () => Promise<R>): Promise<R> => fn();

export const supabase = createClient(
  environment.supabase.url,
  environment.supabase.anonKey,
  { auth: { lock: noopLock } }
);
