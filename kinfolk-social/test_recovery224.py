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
            page.evaluate('(reject)=>{window.__reject224=reject;window.__release224()}',reject_old)
            page.wait_for_timeout(250)
            assert page.locator('#main').count()==0,'stale login must not open main app'
            assert page.evaluate('window.__login224Calls')==1
            assert page.evaluate("localStorage.getItem('kinfolk_stay_logged_in_v1')") is None
            assert 'incorrect' not in page.locator('.kf73Msg').inner_text().lower(),'old error leaked to new login'
            # A reused Login button must not stay disabled after the stale request settles.
            page.wait_for_function("!document.querySelector('.kf73Primary').disabled")
            assert page.locator('.kf73Primary').is_enabled(),'login button remained disabled after stale request'
            assert page.locator('.kf73Primary').inner_text()=='Log in','stale loading label remained after form remount'
            page.locator('.kf73Primary').click()
            page.wait_for_function('window.__login224Calls===2')
            page.locator('#main').wait_for(state='visible',timeout=10000)
            assert page.evaluate('window.state.user?.id')=='11111111-1111-4111-8111-111111111111'
            assert not errors,errors
            page.close()
        print('PASS Recovery224',engine,'stale login success/error after form remount; retry')
        browser.close()
