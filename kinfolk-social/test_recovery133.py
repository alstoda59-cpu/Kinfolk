"""Offline mocked regression: age gate, handler ownership and native redirect safety.
No network requests or real accounts are used.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
P=Path(__file__).parent
# Reuse the established Recovery129 offline HTML/Supabase fixture, without
# executing that file's separate interactive test scenario.
fixture=(P/'test_recovery129.py').read_text().split('with sync_playwright() as p:')[0]
ns={'__file__':str(P/'test_recovery129.py')}
exec(compile(fixture,str(P/'test_recovery129.py'),'exec'),ns)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.set_content(ns['test_html'](),wait_until='load',timeout=30000)
    page.wait_for_timeout(700)
    page.evaluate('''() => {
      const original=window.__kfMock.client.auth.signUp;
      window.__kfMock.client.auth.signUp=async options=>{window.__signupArgs=options;return original(options)};
    }''')
    def reset_signup():
        page.locator('[data-kf73-mode="login"]').click()
        page.locator('[data-kf73-mode="signup"]').click()
        page.wait_for_timeout(180)
        assert page.locator('#kf79Birthdate').count()==1
    def fill(date):
        page.locator('#kf73Name').fill('Synthetic QA')
        page.locator('#kf73Email').fill('synthetic@example.test')
        page.locator('#kf73Password').fill('pass123')
        page.locator('#kf79Birthdate').fill(date)
    reset_signup()
    fill('2020-01-01')
    page.locator('.kf73Primary').click()
    page.wait_for_timeout(150)
    assert page.evaluate('window.__kfMock.signupCalls')==0
    assert '13' in page.locator('.kf73Msg').inner_text()
    # A backend-rejected signup must not overwrite an existing Stay Logged In
    # preference. Only an accepted Supabase signup may persist that choice.
    page.evaluate("""() => {
      localStorage.setItem('kinfolk_stay_logged_in_v1','1');
      localStorage.setItem('kinfolk_stay_logged_in','1');
      window.__signupBeforeFailure=window.__kfMock.client.auth.signUp;
      window.__kfMock.client.auth.signUp=async()=>({data:null,error:new Error('Synthetic signup rejection')});
    }""")
    page.locator('#kf79Birthdate').fill('2000-01-01')
    page.locator('#kf73Stay').uncheck()
    page.locator('.kf73Primary').click()
    page.wait_for_timeout(150)
    assert 'Synthetic signup rejection' in page.locator('.kf73Msg').inner_text()
    assert page.locator('.kf73Primary').is_enabled()
    assert page.evaluate("localStorage.getItem('kinfolk_stay_logged_in_v1')")=='1'
    assert page.evaluate("localStorage.getItem('kinfolk_stay_logged_in')")=='1'
    page.evaluate("window.__kfMock.client.auth.signUp=window.__signupBeforeFailure")
    # Same form, after rejected age: adult signup must not be lost to a
    # competing legacy submit handler.
    page.locator('#kf79Birthdate').fill('2000-01-01')
    page.evaluate("document.querySelector('#authForm').requestSubmit();document.querySelector('#authForm').requestSubmit()")
    page.wait_for_timeout(200)
    assert page.evaluate('window.__kfMock.signupCalls')==1
    assert page.evaluate('window.__signupArgs.options.emailRedirectTo === undefined')
    assert page.evaluate('window.__signupArgs.options.data.signup_birthdate')=='2000-01-01'
    # Email confirmation is still pending; keep the submit control available.
    assert page.locator('.kf73Primary').is_enabled()
    assert page.locator('.kf73Primary').inner_text()=='Create account'
    print('PASS underage -> adult, one SDK call for two same-tick submits; no localhost redirect')
    # A configured verified HTTPS callback may be supplied later by native
    # build configuration. It is not set in production by this test.
    reset_signup()
    page.evaluate("window.KINFOLK_EMAIL_REDIRECT_URL='https://example.test/auth/confirm'")
    fill('2013-01-01')
    page.locator('.kf73Primary').click()
    page.wait_for_timeout(200)
    assert page.evaluate('window.__kfMock.signupCalls')==2
    assert page.evaluate('window.__signupArgs.options.emailRedirectTo')=='https://example.test/auth/confirm'
    print('PASS 13-year-old boundary; configurable HTTPS callback')
    reset_signup()
    fill('1900-01-01')
    page.locator('.kf73Primary').click()
    page.wait_for_timeout(150)
    assert page.evaluate('window.__kfMock.signupCalls')==2
    assert '13–99' in page.locator('.kf73Msg').inner_text()
    print('PASS over-99 rejection; no SDK call')
    assert not errors,errors[:3]
    print('PASS no browser JavaScript errors')
    browser.close()
