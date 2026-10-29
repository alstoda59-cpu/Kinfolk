// Recovery317: until a preview has an approved isolated backend, do not let
// its live-project configuration read/write real Kinfolk accounts.
// This runs before the external SDK and all main-app startup scripts.
// Native Capacitor localhost and the production custom domain are unchanged.
(()=>{
  const host=String(window.location?.hostname||'').toLowerCase();
  if(!/(^|\.)vercel\.app$/.test(host)||window.__kinfolkPreviewBackendBlocked)return;
  window.__kinfolkPreviewBackendBlocked=true;

  // A Vercel preview currently ships source configured for the shared live
  // Supabase project. Restrict network and media before any SDK initializes.
  // A visual overlay alone would NOT stop background auth/session requests.
  const policy=document.createElement('meta');
  policy.setAttribute('http-equiv','Content-Security-Policy');
  policy.setAttribute('content',"default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; form-action 'none'; frame-src 'none'; object-src 'none'");
  document.head.prepend(policy);

  document.addEventListener('submit',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);

  const show=()=>{
    if(!document.body||document.getElementById('kf317PreviewBlocked'))return;
    const pane=document.createElement('section');
    pane.id='kf317PreviewBlocked';
    pane.setAttribute('role','alert');
    pane.setAttribute('aria-label','Kinfolk preview backend isolation required');
    pane.style.cssText='position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:24px;background:#17151c;color:#f8f5fa;font:16px/1.5 system-ui,-apple-system,sans-serif;text-align:center;overflow:auto';
    const card=document.createElement('div');
    card.style.cssText='width:100%;max-width:440px;border:1px solid #524054;border-radius:22px;padding:28px 22px;background:#26202b';
    const title=document.createElement('h1');
    title.textContent='Kinfolk preview is paused';
    title.style.cssText='font-size:23px;line-height:1.25;margin:0 0 12px;color:#ff88be';
    const message=document.createElement('p');
    message.textContent='This preview still points to the shared live Kinfolk backend. Sign-in, signup, uploads and private data access are blocked until a separate test backend is configured.';
    message.style.cssText='margin:0;color:#ded1df';
    card.append(title,message);
    pane.appendChild(card);
    document.body.appendChild(pane);
    document.body.style.overflow='hidden';
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show,{once:true});
  else show();
})();
