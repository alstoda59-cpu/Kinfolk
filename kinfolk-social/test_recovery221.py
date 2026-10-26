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
        page.locator('#kf73Name').fill('Synthetic Member')
        page.locator('#kf217Username').fill('synthetic221')
        page.locator('#kf73Email').fill('synthetic@example.test')
        page.locator('#kf73Password').fill('password9')
        page.locator('#kf217ConfirmPassword').fill('password9')
        page.locator('#kf79Birthdate').fill('2000-01-01')
        page.locator('.kf73Primary').click()
        panel = page.locator('#kf221Verification')
        panel.wait_for(state='visible')
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
        # Address edits must not silently redirect a resend to an unsubmitted address.
        page.locator('#kf73Email').fill('different@example.test')
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
        print('PASS Recovery221', engine, 'mobile resend, cooldown, captured email, error and navigation guards')
        browser.close()
