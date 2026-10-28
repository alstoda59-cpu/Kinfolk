from pathlib import Path
import re,json,traceback,time
from playwright.sync_api import sync_playwright
P=Path(__file__).parent
MOCK=r'''(function(){
const storage=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};
Object.defineProperty(window,'localStorage',{configurable:true,value:storage()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:storage()});
const user={id:'11111111-1111-4111-8111-111111111111',email:'qa@example.test',user_metadata:{username:'qa_member',display_name:'QA Member'},app_metadata:{}};
const profile={id:user.id,username:'qa_member',display_name:'QA Member',bio:'Test',accent_color:'#14b8a6'};
let session=null,authEmail=user.email;const listeners=[],queries=[];let signupCalls=0;
function emit(e,s){for(const f of listeners)Promise.resolve().then(()=>f(e,s))}
function rows(table){if(table==='profiles')return [profile];if(table==='kinfolk_profile_extras')return [{user_id:user.id,music_url:null,gender:'Female'}];return []}
function from(table){let method='select',filters=[],values=null,selected=false,one=false;const q={
 select(){selected=true;return q},eq(k,v){filters.push([k,v]);return q},gt(){return q},in(){return q},or(){return q},order(){return q},limit(){return q},maybeSingle(){one=true;return q},single(){one=true;return q},update(v){method='update';values=v;return q},insert(v){method='insert';values=v;return q},upsert(v){method='upsert';values=v;return q},delete(){method='delete';return q},then(ok,bad){const promise=Promise.resolve().then(()=>{
 queries.push({table,method,values,filters});if(table==='profiles'&&method==='update'&&values)Object.assign(profile,values);
 let data=rows(table).filter(x=>filters.every(([k,v])=>x[k]===v));if(method==='insert'||method==='upsert'){data=one?(Array.isArray(values)?values[0]:values):values} else if(method==='update'&&table!=='profiles'){data=one?null:[]}
 return {data:one?(data[0]||null):data,error:null,count:(method==='update'||method==='upsert')?1:0};});return promise.then(ok,bad)}
};return q}
const auth={getSession:async()=>({data:{session},error:null}),setSession:async()=>{session={user:{...user,email:authEmail},access_token:'fake',refresh_token:'fake'};emit('SIGNED_IN',session);return{data:{session},error:null}},signInWithPassword:async()=>auth.setSession(),signUp:async args=>{signupCalls++;return{data:{user:{...user,email:args.email},session:null},error:null}},signOut:async()=>{session=null;emit('SIGNED_OUT',null);return{error:null}},onAuthStateChange:f=>{listeners.push(f);Promise.resolve().then(()=>f('INITIAL_SESSION',session));return{data:{subscription:{unsubscribe(){}}}}},resetPasswordForEmail:async()=>({error:null})};
const client={auth,from,rpc:async()=>({data:[],error:null}),storage:{from:()=>({createSignedUrl:async(path)=>({data:{signedUrl:'https://example.test/'+path},error:null}),upload:async()=>({error:null}),remove:async()=>({error:null})})}};
window.supabase={createClient:()=>client};window.__kfMock={get session(){return session},get signupCalls(){return signupCalls},queries,profile,emit,client,user};
const nativeFetch=window.fetch;window.fetch=async function(url,opts){if(String(url).includes('/auth/v1/token')){try{authEmail=JSON.parse(opts?.body||'{}').email||user.email}catch{authEmail=user.email}return new Response(JSON.stringify({access_token:'fake',refresh_token:'fake',user:{...user,email:authEmail}}),{status:200,headers:{'Content-Type':'application/json'}});}return new Response(JSON.stringify([]),{status:200,headers:{'Content-Type':'application/json'}})};
})();'''

def test_html():
 s=(P/'index.html').read_text()
 s=s.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>', '<script>'+MOCK+'</script>')
 def replace(m):
  path=P/m.group(1).lstrip('/')
  if not path.exists():raise Exception('missing '+str(path))
  body=path.read_text().replace('</script>','<\\/script>')
  return '<script>'+body+'</script>'
 s=re.sub(r'<script src="(/kinfolk-[^"]+\.js)"></script>',replace,s)
 # Dynamic loaders for phase88-core / phase90-core are disabled in offline test;
 # their behavior is not counted as tested here.
 return s

with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage'])
 context=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 page=context.new_page()
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(test_html(),wait_until='load',timeout=30000)
 page.wait_for_timeout(1400)
 print('STARTUP',page.locator('#authForm').count(),page.locator('.kf73Title').all_inner_texts(),page.locator('#main').count(),'errors',errors[:5])
 assert page.locator('#authForm').count()==1
 assert 'Welcome back' in page.locator('.kf73Title').inner_text()
 assert page.locator('#main').count()==0
 # Password >12 should not be blocked for existing users, signup remains 5-12.
 page.locator('#kf73Email').fill('qa@example.test')
 page.locator('#kf73Password').fill('valid-long-password-123')
 page.locator('#kf73Stay').uncheck()
 # Failed credentials must not rewrite the persistent session preference.
 page.evaluate("""() => {
   localStorage.setItem('kinfolk_stay_logged_in_v1','1');
   localStorage.setItem('kinfolk_stay_logged_in','1');
   window.__authFetchBeforeFailure=window.fetch;
   window.fetch=async (url,opts)=>{
     if(String(url).includes('/auth/v1/token'))
       return new Response(JSON.stringify({error:'invalid_grant',error_description:'Invalid login credentials'}),{status:400,headers:{'Content-Type':'application/json'}});
     return window.__authFetchBeforeFailure(url,opts);
   };
 }""")
 page.locator('.kf73Primary').click()
 page.wait_for_timeout(300)
 assert page.evaluate("localStorage.getItem('kinfolk_stay_logged_in_v1')")=='1'
 assert page.evaluate("localStorage.getItem('kinfolk_stay_logged_in')")=='1'
 assert page.locator('.kf73Primary').is_enabled()
 assert 'incorrect' in page.locator('.kf73Msg').inner_text().lower()
 page.evaluate("window.fetch=window.__authFetchBeforeFailure")
 # Delay the synthetic token endpoint and submit twice to catch overlapping
 # requests on slow mobile connections. No real backend traffic is sent.
 page.evaluate("""() => {
   window.__loginTokenCalls=0;
   const original=window.fetch;
   window.fetch=async (...args)=>{
     if(String(args[0]).includes('/auth/v1/token')){
       window.__loginTokenCalls++;
       await new Promise(resolve=>setTimeout(resolve,180));
     }
     return original(...args);
   };
 }""")
 page.locator('.kf73Primary').click()
 page.evaluate("document.querySelector('#authForm').requestSubmit()")
 page.wait_for_timeout(2800)
 assert page.evaluate('window.__loginTokenCalls')==1,'duplicate login token requests'
 print('AFTER LOGIN',page.locator('#main').count(),page.locator('.kf73Title').all_inner_texts(),'session',page.evaluate('!!window.__kfMock.session'),'tab',page.evaluate("sessionStorage.getItem('kinfolk_session_tab')"),'errors',errors[-5:])
 assert page.locator('#main').count()==1,'login did not open main app'
 assert page.evaluate('window.state.user?.id')=='11111111-1111-4111-8111-111111111111'
 assert page.evaluate("sessionStorage.getItem('kinfolk_session_tab')")=='1'
 # Repeated auth events and session activation must not refetch everything or reset the screen.
 before=page.evaluate("window.__kfMock.queries.filter(q=>q.table==='posts').length")
 page.evaluate("window.__kfMock.emit('TOKEN_REFRESHED',window.__kfMock.session)")
 page.evaluate("window.__kfMock.emit('SIGNED_IN',window.__kfMock.session)")
 page.evaluate("window.kf129ActivateSession(window.__kfMock.session)")
 page.wait_for_timeout(200)
 after=page.evaluate("window.__kfMock.queries.filter(q=>q.table==='posts').length")
 assert after==before,(before,after)
 print('REPEATED AUTH events did not trigger extra feed loads')
 # Signed-in Home, Reels, Channels navigation with synthetic empty datasets.
 for section in ['reels','channels','home']:
  page.evaluate('(section)=>window.setView(section)',section)
  page.wait_for_timeout(250)
  assert page.locator('#main').count()==1 and page.locator('#main').inner_text().strip()!='Loading…',section
 print('NAVIGATION Home/Reels/Channels synthetic: passed')
 # Navigate to Profile and open Edit Profile. Preserve Settings color picker, remove only duplicate.
 page.evaluate("window.setView('profile')")
 page.wait_for_timeout(600)
 print('PROFILE',page.locator('#main').inner_text()[:350])
 page.evaluate('window.openEditProfile()')
 page.wait_for_timeout(250)
 print('EDIT',page.locator('#profileForm').count(),'accent',page.locator('#editAccent').count())
 assert page.locator('#profileForm').count()==1
 assert page.locator('#editAccent').count()==0
 page.locator('#editDisplay').fill('QA Updated')
 page.locator('#profileForm button').filter(has_text='Save profile').first.click()
 page.wait_for_timeout(1000)
 updates=page.evaluate("window.__kfMock.queries.filter(q=>q.table==='profiles'&&q.method==='update')")
 print('PROFILE UPDATES',updates[-3:])
 assert updates and all('accent_color' not in (q['values'] or {}) for q in updates)
 assert page.evaluate('window.__kfMock.profile.display_name')=='QA Updated'
 # Settings' color picker still present.
 try:
  page.evaluate('window.openKinfolkSettings()')
  page.wait_for_timeout(750)
  print('SETTINGS color inputs',page.locator('input[type="color"]').count())
  assert page.locator('input[type="color"]').count()>=1
 except Exception as e:
  print('SETTINGS TEST FAILED',str(e)[:350]);raise
 # 13+ signup gate test with current page signed out.
 page.evaluate('window.__kfMock.client.auth.signOut()')
 page.wait_for_timeout(400)
 page.locator('[data-kf73-mode="signup"]').click()
 page.wait_for_timeout(650)
 print('SIGNUP',page.locator('.kf73Title').all_inner_texts(),'birth',page.locator('#kf79Birthdate').count())
 assert page.locator('#kf79Birthdate').count()==1
 page.locator('#kf73Name').fill('Young QA')
 page.locator('#kf217Username').fill('young_qa')
 page.wait_for_function("document.querySelector('#kf73Password')?.maxLength === 128 && document.querySelector('#kf217ConfirmPassword')?.maxLength === 128")
 page.locator('#kf73Email').fill('young@example.test')
 page.locator('#kf73Password').fill('pass123456789')
 page.locator('#kf217ConfirmPassword').fill('pass123456789')
 page.locator('#kf79Birthdate').fill('2020-01-01')
 assert page.locator('#kf73Password').input_value()==page.locator('#kf217ConfirmPassword').input_value(), 'signup passwords were unexpectedly altered before submit'
 page.locator('.kf73Primary').click()
 page.wait_for_timeout(400)
 print('UNDERAGE',page.locator('.kf73Msg').all_inner_texts(),page.evaluate('window.__kfMock.signupCalls'))
 assert page.evaluate('window.__kfMock.signupCalls')==0
 assert '13' in page.locator('.kf73Msg').inner_text()
 page.locator('#kf79Birthdate').fill('2000-01-01')
 page.locator('.kf73Primary').click()
 page.wait_for_timeout(400)
 print('ADULT signup state',page.evaluate('window.__kfMock.signupCalls'),page.locator('.kf73Msg').all_inner_texts(),page.locator('.kf73Primary').get_attribute('disabled'))
 assert page.evaluate('window.__kfMock.signupCalls')==1
 print('ADULT SIGNUP mock SDK called once')
 print('PASS: unauth startup, login without reload, stay flag, profile save without accent overwrite, settings picker retained, 13+ signup gate')
 b.close()
