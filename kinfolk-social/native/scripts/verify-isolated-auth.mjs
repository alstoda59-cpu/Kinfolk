// Read-only reachability gate for the designated isolated Kinfolk alpha Auth API.
// A successful response does NOT prove signup, email delivery, RLS, or device QA.
import { ALPHA_REF } from './alpha-backend-config.mjs';

// A reachable Auth API can still be unusable for Kinfolk's email-confirmed signup.
// Fail closed if the server omits a setting; do not infer that confirmation is on.
export function assertEmailSignupReady(settings) {
  if (settings?.disable_signup !== false) {
    throw new Error('Isolated Auth signup is disabled or its signup setting is unavailable.');
  }
  if (settings?.external?.email !== true) {
    throw new Error('Isolated Auth email/password provider is disabled or its setting is unavailable.');
  }
  if (settings?.mailer_autoconfirm !== false) {
    throw new Error('Isolated Auth email confirmation must be explicitly enabled for the alpha.');
  }
}

export async function verifyIsolatedAuthReachability(config, { fetchImpl=globalThis.fetch, timeoutMs=8000, requireEmailSignupReady=false }={}) {
  if (!config || config.projectRef!==ALPHA_REF || config.offlineStub ||
      config.url!=='https://'+ALPHA_REF+'.supabase.co' || !config.key) {
    throw new Error('Auth reachability check requires the designated isolated alpha backend.');
  }
  if (typeof fetchImpl!=='function') throw new Error('Fetch is unavailable for isolated Auth reachability check.');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response=await fetchImpl(config.url+'/auth/v1/settings', {
      method:'GET',
      headers:{ apikey:config.key, accept:'application/json' },
      redirect:'manual',
      cache:'no-store',
      signal:controller.signal
    });
    if (response.status!==200) throw new Error('Isolated Auth settings endpoint did not return HTTP 200.');
    if (!/\bapplication\/json\b/i.test(response.headers?.get('content-type')||'')) {
      throw new Error('Isolated Auth settings endpoint did not return JSON.');
    }
    const data=await response.json();
    if (!data || typeof data!=='object' || Array.isArray(data) ||
        !(data.external && typeof data.external==='object' && !Array.isArray(data.external) ||
          typeof data.disable_signup==='boolean' || typeof data.mailer_autoconfirm==='boolean')) {
      throw new Error('Isolated Auth settings response was not recognized.');
    }
    if (requireEmailSignupReady) assertEmailSignupReady(data);
    return { projectRef:ALPHA_REF, reachable:true };
  } finally {
    clearTimeout(timeout);
  }
}
