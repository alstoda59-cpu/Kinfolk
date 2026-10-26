// Recovery233: native-only Supabase isolation. Never ship a test APK connected
// to Kinfolk's shared live backend. The web preview remains unchanged.
export const LIVE_REF='zojajuzmfjpvubzibzgg';
export const LIVE_KEY='sb_publishable_1te_hrDXQciMD7Gp1EXmRw_dvQmszvi';
export const CI_REF='aaaaaaaaaaaaaaaaaaaa';
export const CI_KEY='sb_publishable_ci_packaging_only_no_auth';

export function alphaBackendConfig(env=process.env){
  const url=String(env.KINFOLK_ALPHA_SUPABASE_URL||'').trim();
  const key=String(env.KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY||'').trim();
  if(!url||!key)throw new Error('Native alpha packaging requires KINFOLK_ALPHA_SUPABASE_URL and KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY for an isolated test project.');
  const match=/^https:\/\/([a-z0-9]{20})\.supabase\.co$/.exec(url);
  if(!match)throw new Error('Native alpha Supabase URL must be a canonical HTTPS project URL.');
  const projectRef=match[1];
  if(projectRef===LIVE_REF)throw new Error('Native alpha refuses the shared live Kinfolk Supabase project.');
  if(!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key)||key===LIVE_KEY)throw new Error('Native alpha requires a separate Supabase publishable key; never use the live key or a service-role key.');
  const offlineStub=projectRef===CI_REF&&key===CI_KEY;
  if((projectRef===CI_REF||key===CI_KEY)&&!offlineStub)throw new Error('Offline CI backend markers must be used together.');
  if(offlineStub&&env.KINFOLK_ALPHA_PACKAGING_ONLY!=='1')throw new Error('Offline CI backend markers are allowed only for packaging checks, never for a functional alpha.');
  return {url,key,projectRef,offlineStub};
}

export function isolateNativeAsset(source,config){
  return source.replaceAll(LIVE_REF,config.projectRef).replaceAll(LIVE_KEY,config.key);
}
