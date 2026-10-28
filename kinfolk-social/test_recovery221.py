"""Full existing app with synthetic SDK; all network blocked. Not device/backend QA."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
P = Path(__file__).parent
ns = {'__file__': str(P / 'test_recovery129.py')}
exec(compile((P/'test_recovery129.py').read_text().split('with sync_playwright() as p:')[0], str(P/'test_recovery129.py'), 'exec'), ns)
with sync_playwright() as p:
    for engine in os.environ.get('KINFOLK_TEST_ENGINES','chromium,webkit').split(','):
        browser = getattr(p, engine).launch(headless=True)
        page = browser.new_page(viewport={'width':390, 'height':844}, is_mobile=True, has_touch=True)
        page.route('**/*', lambda route: route.abort())
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.set_content(ns['test_html'](), wait_until='load')
        page.locator('[data-kf73-mode="signup"]').click()
        # The reused login password input must adopt signup limits before any typing.
        page.wait_for_function("document.querySelector('#kf217ConfirmPassword') && document.querySelector('#kf73Password').maxLength === 128")
        page.locator('#kf73Name').fill('Synthetic Member')
        page.locator('#kf217Username').fill('synthetic221')
        page.locator('#kf73Email').fill('synthetic@example.test')
        page.locator('#kf73Password').fill('password9!234')
        page.locator('#kf217ConfirmPassword').fill('password9!234')
        page.locator('#kf79Birthdate').fill('2000-01-01')
        page.locator('.kf73Primary').click()
        page.wait_for_timeout(220)
        signup_state=page.evaluate("""() => {
            const form=document.querySelector('#authForm');
            return {
                signupCalls:window.__kfMock.signupCalls,
                valid:form?.checkValidity(),
                invalid:[...form.querySelectorAll('input,select')].filter(e=>!e.checkValidity()).map(e=>({id:e.id,reason:e.validationMessage,length:e.value.length})),
                title:form.querySelector('.kf73Title')?.textContent,
                message:form.querySelector('.kf73Msg')?.textContent,
                verificationPending:!!form.__kf221Verification,
                panelCount:form.querySelectorAll('#kf221Verification').length,
                errors:window.__kf221Errors||[]
            };
        }""")
        assert signup_state['signupCalls']==1,signup_state
        panel = page.locator('#kf221Verification')
        assert panel.count()==1,signup_state
        panel.wait_for(state='visible',timeout=5000)
        assert 'synthetic@example.test' in panel.inner_text()
        assert page.evaluate("localStorage.getItem('kinfolk_stay_logged_in_v1')") is None
        page.evaluate("""() => {
            window.__resends=[];
            window.__kfMock.client.auth.resend=async args=>{
                window.__resends.push(args);
                return await new Promise(resolve=>window.__finishResend=resolve);
            };
        }""")
        resend = panel.locator('button')
        resend.click()
        assert resend.is_disabled()
        page.evaluate("document.querySelector('#kf221Verification button').onclick()")
        assert page.evaluate('window.__resends.length') == 1
        args=page.evaluate('window.__resends[0]')
        assert args == {'type':'signup', 'email':'synthetic@example.test'}
        page.evaluate('window.__finishResend({error:null})')
        page.wait_for_function("!document.querySelector('#kf221Verification button').disabled")
        assert 'a new email has been requested' in panel.inner_text()
        resend.click()
        assert 'wait a minute' in panel.inner_text()
        assert page.evaluate('window.__resends.length') == 1
        # A rate-limited resend retains its cooldown for the original email.
        page.evaluate("document.querySelector('#authForm').__kf221Verification.retryAt=0")
        resend.click()
        assert page.evaluate('window.__resends[1].email') == 'synthetic@example.test'
        page.evaluate('window.__finishResend({error:{status:429}})')
        page.wait_for_function("!document.querySelector('#kf221Verification button').disabled")
        assert 'Too many email requests' in panel.inner_text()
        # Navigation during an outstanding resend cannot repaint the login form.
        page.evaluate("document.querySelector('#authForm').__kf221Verification.retryAt=0")
        resend.click()
        page.locator('[data-kf73-mode="login"]').click()
        page.evaluate('window.__finishResend({error:null})')
        page.wait_for_timeout(150)
        assert page.locator('#kf221Verification').count() == 0
        assert 'Welcome back' in page.locator('.kf73Title').inner_text()
        assert page.locator('.kf73Primary').is_enabled()
        assert not errors, errors
        # A changed email invalidates the old verification panel. It must not
        # resend to the original address after the member edits the form.
        page2=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        page2.route('**/*',lambda route:route.abort())
        page2.set_content(ns['test_html'](),wait_until='load')
        page2.locator('[data-kf73-mode="signup"]').click()
        page2.wait_for_function("document.querySelector('#kf217ConfirmPassword')")
        page2.locator('#kf73Name').fill('Synthetic Member')
        page2.locator('#kf217Username').fill('synthetic221')
        page2.locator('#kf73Email').fill('synthetic@example.test')
        page2.locator('#kf73Password').fill('password9!234')
        page2.locator('#kf217ConfirmPassword').fill('password9!234')
        page2.locator('#kf79Birthdate').fill('2000-01-01')
        page2.locator('.kf73Primary').click()
        page2.locator('#kf221Verification').wait_for(state='visible',timeout=5000)
        page2.evaluate("""() => {
            window.__resends=[];
            window.__kfMock.client.auth.resend=async args=>{window.__resends.push(args);return {error:null}};
        }""")
        page2.locator('#kf73Email').fill('different@example.test')
        page2.locator('#kf221Verification button').click()
        assert page2.evaluate('window.__resends.length')==0
        assert 'Email address changed' in page2.locator('#kf221Verification').inner_text()
        assert page2.locator('#kf221Verification button').is_disabled()
        page2.close()
        print('PASS Recovery221', engine, 'mobile resend, cooldown, stale-email refusal and navigation guards')
        browser.close()
