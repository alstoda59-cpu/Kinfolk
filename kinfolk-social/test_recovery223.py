"""Recovery223: prevent stale signup results after Login->Signup on reused mobile form.
Mocked SDK, network-blocked Chromium/WebKit only; no real Supabase user.
"""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright

P=Path(__file__).parent
ns={'__file__':str(P/'test_recovery129.py')}
exec(compile((P/'test_recovery129.py').read_text().split('with sync_playwright() as p:')[0],str(P/'test_recovery129.py'),'exec'),ns)

def fill_signup(page,email):
    page.locator('#kf73Name').fill('Synthetic QA')
    page.locator('#kf217Username').fill('synthetic223')
    page.locator('#kf73Email').fill(email)
    page.locator('#kf73Password').fill('password9!234')
    page.locator('#kf217ConfirmPassword').fill('password9!234')
    page.locator('#kf79Birthdate').fill('2000-01-01')

with sync_playwright() as p:
    for engine in os.environ.get('KINFOLK_TEST_ENGINES','chromium,webkit').split(','):
        browser=getattr(p,engine).launch(headless=True)
        for rejection,wrong_identity in ((False,False),(True,False),(False,True)):
            page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
            page.route('**/*',lambda route:route.abort())
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_content(ns['test_html'](),wait_until='load')
            page.locator('[data-kf73-mode="signup"]').click()
            fill_signup(page,'old@example.test')
            page.evaluate("""() => {
                window.__firstForm=document.querySelector('#authForm');
                window.__firstTitle=window.__firstForm.querySelector('.kf73Title');
                window.__signup223Calls=0;
                window.__resolvers223=[];
                window.__kfMock.client.auth.signUp=async options=>{
                    window.__signup223Calls++;
                    return new Promise(resolve=>window.__resolvers223.push(resolve));
                };
            }""")
            page.locator('.kf73Primary').click()
            page.wait_for_function('window.__signup223Calls===1')
            page.locator('[data-kf73-mode="login"]').click()
            page.locator('[data-kf73-mode="signup"]').click()
            page.locator('#kf79Birthdate').wait_for(state='visible')
            assert page.evaluate("""() => {
                const form=document.querySelector('#authForm');
                return form===window.__firstForm && form.querySelector('.kf73Title')!==window.__firstTitle;
            }"""),'test must reproduce reused form with replaced title node'
            fill_signup(page,'new@example.test')
            page.locator('.kf73Primary').click()
            assert page.evaluate('window.__signup223Calls')==1
            assert 'previous account creation request' in page.locator('.kf73Msg').inner_text().lower()
            # Both synthetic success responses must carry the exact requested email.
            # Otherwise the Phase79 fail-closed identity guard would reject them
            # before this test could exercise the intended stale-form race.
            response=({'data':None,'error':{'message':'Synthetic signup rejected'}} if rejection
                      else {'data':{'session':None,'user':{'id':'synthetic','email':'old@example.test'}},'error':None})
            page.evaluate('(result)=>window.__resolvers223[0](result)',response)
            page.wait_for_timeout(200)
            assert page.locator('#kf221Verification').count()==0,'old result must not mount verification'
            assert 'old@example.test' not in page.locator('#authForm').inner_text()
            assert 'Synthetic signup rejected' not in page.locator('#authForm').inner_text()
            assert page.evaluate('window.__signup223Calls')==1
            page.locator('.kf73Primary').click()
            page.wait_for_function('window.__signup223Calls===2')
            page.evaluate("""(wrongIdentity) => window.__resolvers223[1]({
                data:{user:{id:'new-user',email:wrongIdentity?'another@example.test':'new@example.test'},session:null},error:null
            })""",wrong_identity)
            if wrong_identity:
                page.wait_for_function("document.querySelector('.kf73Msg')?.textContent.includes('different email account')")
                assert page.locator('#kf221Verification').count()==0,'mismatched signup email must not show verification'
                assert 'different email account' in page.locator('.kf73Msg').inner_text()
            else:
                page.locator('#kf221Verification').wait_for(state='visible')
                assert 'new@example.test' in page.locator('#kf221Verification').inner_text()
            assert not errors,errors
            page.close()
        print('PASS Recovery223',engine,'stale signup ignored; valid retry verifies; mismatched email fails closed')
        browser.close()
