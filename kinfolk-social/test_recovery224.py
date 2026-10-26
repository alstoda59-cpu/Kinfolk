"""Recovery224 mobile login lifecycle regression on the full app with a synthetic SDK.
Blocks external network. Not a real Supabase or physical-device test.
"""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright

P=Path(__file__).parent
ns={'__file__':str(P/'test_recovery129.py')}
exec(compile((P/'test_recovery129.py').read_text().split('with sync_playwright() as p:')[0],str(P/'test_recovery129.py'),'exec'),ns)

with sync_playwright() as p:
    for engine in os.environ.get('KINFOLK_TEST_ENGINES','chromium,webkit').split(','):
        browser=getattr(p,engine).launch(headless=True)
        for reject_old in (False,True):
            page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
            page.route('**/*',lambda route:route.abort())
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(ns['test_html'](),wait_until='load')
            page.locator('#kf73Email').fill('old@example.test')
            page.locator('#kf73Password').fill('password9')
            page.evaluate("""() => {
                window.__oldLoginForm=document.querySelector('#authForm');
                window.__oldLoginTitle=window.__oldLoginForm.querySelector('.kf73Title');
                window.__login224Calls=0;
                const original=window.fetch;
                window.fetch=async (...args)=>{
                    if(String(args[0]).includes('/auth/v1/token')){
                        window.__login224Calls++;
                        (window.__login224Payloads ||= []).push(JSON.parse(args[1]?.body || '{}'));
                        if(window.__login224Calls===1){
                            await new Promise(resolve=>window.__release224=resolve);
                            if(window.__reject224)
                                return new Response(JSON.stringify({error_description:'Invalid login credentials'}),
                                    {status:400,headers:{'Content-Type':'application/json'}});
                        }
                    }
                    return original(...args);
                };
            }""")
            page.locator('.kf73Primary').click()
            page.wait_for_function('window.__login224Calls===1')
            page.locator('[data-kf73-mode="signup"]').click()
            page.locator('[data-kf73-mode="login"]').click()
            page.wait_for_function("""() => {
                const f=document.querySelector('#authForm');
                return f===window.__oldLoginForm &&
                    f.querySelector('.kf73Title')!==window.__oldLoginTitle &&
                    f.querySelector('.kf73Title').textContent.includes('Welcome back');
            }""")
            page.locator('#kf73Email').fill('new@example.test')
            page.locator('#kf73Password').fill('password9')
            page.wait_for_timeout(100)
            page.locator('.kf73Primary').click()
            assert page.evaluate('window.__login224Calls')==1,'second login must wait'
            assert 'previous login attempt' in page.locator('.kf73Msg').inner_text().lower()
            assert page.evaluate("document.querySelector('#authForm').dataset.kf95LoginPending")=='1','first login must still hold its request lock'
            page.evaluate('(reject)=>{window.__reject224=reject;window.__release224()}',reject_old)
            # Synchronize with the actual async finally cleanup instead of an unreliable fixed delay.
            page.wait_for_function("document.querySelector('#authForm').dataset.kf95LoginPending!=='1'")
            assert page.locator('#main').count()==0,'stale login must not open main app'
            assert page.evaluate('window.__login224Calls')==1
            assert page.evaluate("localStorage.getItem('kinfolk_stay_logged_in_v1')") is None
            assert 'incorrect' not in page.locator('.kf73Msg').inner_text().lower(),'old error leaked to new login'
            # A reused Login button must not stay disabled after the stale request settles.
            page.wait_for_function("!document.querySelector('.kf73Primary').disabled")
            assert page.locator('.kf73Primary').is_enabled(),'login button remained disabled after stale request'
            assert page.locator('.kf73Primary').inner_text()=='Log in','stale loading label remained after form remount'
            # The rejected in-flight submit may clear the password for safety. Re-enter it
            # explicitly before retrying; do not assume a sensitive field is retained.
            page.locator('#kf73Password').fill('password9')
            assert page.locator('#kf73Password').input_value()=='password9'
            assert page.evaluate("document.querySelector('#authForm').checkValidity()"), 'retry form must be valid'
            page.locator('.kf73Primary').click()
            page.wait_for_timeout(400)
            if page.evaluate('window.__login224Calls')!=2:
                print('RECOVERY226 RETRY DIAGNOSTIC',engine,reject_old,page.evaluate("""() => {
                    const f=document.querySelector('#authForm'), b=f.querySelector('.kf73Primary');
                    return {calls:window.__login224Calls,mode:f.querySelector('.kf73Title')?.textContent,
                        formSame:f===window.__oldLoginForm,capture:f.__kf95CaptureInstalled,
                        ownSubmit:f.onsubmit===f.__kf95Handler,
                        pending:f.dataset.kf95LoginPending,buttonDisabled:b.disabled,buttonType:b.type,
                        formValid:f.checkValidity(),message:f.querySelector('.kf73Msg')?.textContent,
                        email:f.querySelector('#kf73Email')?.value,
                        session:!!window.__kfMock.session};
                }"""),flush=True)
            page.wait_for_function('window.__login224Calls===2')
            assert page.evaluate("window.__login224Payloads[1].email")=='new@example.test', 'retry must use current login email'
            assert page.evaluate("window.__login224Payloads[1].password")=='password9', 'retry must use newly entered password'
            page.locator('#main').wait_for(state='visible',timeout=10000)
            assert page.evaluate('window.state.user?.id')=='11111111-1111-4111-8111-111111111111'
            assert not errors,errors
            page.close()
        print('PASS Recovery224',engine,'stale login success/error after form remount; retry')
        browser.close()
