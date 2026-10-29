// Native-only email confirmation callback validation. A valid HTTPS URL is
// necessary but not sufficient: Supabase allowlisting and App Links must be
// verified separately on real devices.
import { isIP } from 'node:net';
export function alphaEmailCallback(value,{required=false}={}){
  const raw=String(value||'').trim();
  if(!raw){
    if(required)throw new Error('Functional native alpha requires KINFOLK_ALPHA_EMAIL_REDIRECT_URL (approved HTTPS callback).');
    return null;
  }
  let parsed;
  try{parsed=new URL(raw)}catch{throw new Error('Native alpha email callback must be a valid HTTPS URL.')}
  const host=parsed.hostname.toLowerCase().replace(/\.$/,'').replace(/^\[|\]$/g,'');
  // Recovery320: Vercel previews intentionally fail closed before Auth boots.
  // Email links there cannot complete native login. Supabase API endpoints,
  // local hosts and IP literals are not public app-link callback destinations.
  const blockedHost=host==='localhost'||host.endsWith('.localhost')||
    host==='vercel.app'||host.endsWith('.vercel.app')||
    host==='supabase.co'||host.endsWith('.supabase.co')||
    host.endsWith('.local')||isIP(host)!==0;
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||
     blockedHost||parsed.hash||parsed.port){
    throw new Error('Native alpha email callback must be HTTPS on a public app-link host, without credentials, a fragment or a nonstandard port. Vercel previews and Supabase API hosts cannot be used.');
  }
  return parsed.href;
}
