// Native-only email confirmation callback validation. A valid HTTPS URL is
// necessary but not sufficient: Supabase allowlisting and App Links must be
// verified separately on real devices.
export function alphaEmailCallback(value,{required=false}={}){
  const raw=String(value||'').trim();
  if(!raw){
    if(required)throw new Error('Functional native alpha requires KINFOLK_ALPHA_EMAIL_REDIRECT_URL (approved HTTPS callback).');
    return null;
  }
  let parsed;
  try{parsed=new URL(raw)}catch{throw new Error('Native alpha email callback must be a valid HTTPS URL.')}
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||
     ['localhost','127.0.0.1','0.0.0.0'].includes(parsed.hostname)||
     parsed.hash){
    throw new Error('Native alpha email callback must be HTTPS, non-local, without credentials or a fragment.');
  }
  return parsed.href;
}
