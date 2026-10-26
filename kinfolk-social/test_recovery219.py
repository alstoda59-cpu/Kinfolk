"""Recovery219: offline Android-size Chromium signup privacy. No live backend."""
from pathlib import Path
from playwright.sync_api import sync_playwright
P=Path(__file__).parent
fixture=(P/'test_recovery129.py').read_text().split('with sync_playwright() as p:')[0]
ns={'__file__':str(P/'test_recovery129.py')}
exec(compile(fixture,str(P/'test_recovery129.py'),'exec'),ns)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(ns['test_html'](),wait_until='load',timeout=30000)
    page.wait_for_timeout(700)
    page.locator('[data-kf73-mode="signup"]').click()
    page.wait_for_timeout(260)
    assert page.locator('#kf219Gender').count()==1
    assert page.locator('#kf219Private').count()==1
    page.locator('#kf79Birthdate').fill('2010-01-01')
    assert page.locator('#kf219Private').is_checked()
    assert page.locator('#kf219Private').is_disabled()
    page.locator('#kf79Birthdate').fill('2000-01-01')
    assert page.locator('#kf219Private').is_enabled()
    assert not page.locator('#kf219Private').is_checked()
    page.locator('#kf218ProfileSetup summary').click()
    page.locator('#kf219Gender').select_option('Nonbinary')
    page.locator('#kf219Private').check()
    page.locator('#kf73Name').fill('Test Member')
    page.locator('#kf217Username').fill('member219')
    page.locator('#kf73Email').fill('member@example.test')
    page.locator('#kf73Password').fill('password9')
    page.locator('#kf217ConfirmPassword').fill('password9')
    page.evaluate("window.__kfPrevSignUp=window.__kfMock.client.auth.signUp;window.__kfMock.client.auth.signUp=async x=>{window.__kf219Args=x;return window.__kfPrevSignUp(x)}")
    page.locator('.kf73Primary').click()
    page.wait_for_timeout(200)
    assert page.evaluate('window.__kfMock.signupCalls')==1
    args=page.evaluate('window.__kf219Args.options.data')
    assert args['signup_gender']=='Nonbinary'
    assert args['profile_private']=='true'
    assert args['signup_birthdate']=='2000-01-01'
    page.locator('[data-kf73-mode="login"]').click()
    page.locator('[data-kf73-mode="signup"]').click()
    page.wait_for_timeout(260)
    page.locator('#kf73Name').fill('Teen Member')
    page.locator('#kf217Username').fill('teenmember219')
    page.locator('#kf73Email').fill('teen@example.test')
    page.locator('#kf73Password').fill('password9')
    page.locator('#kf217ConfirmPassword').fill('password9')
    page.locator('#kf79Birthdate').fill('2010-01-01')
    assert page.locator('#kf219Private').is_checked()
    assert page.locator('#kf219Private').is_disabled()
    page.locator('.kf73Primary').click()
    page.wait_for_timeout(200)
    assert page.evaluate('window.__kfMock.signupCalls')==2
    args=page.evaluate('window.__kf219Args.options.data')
    assert args['profile_private']=='true'
    assert args['signup_birthdate']=='2010-01-01'
    assert not errors,errors
    print('PASS Recovery219 mock mobile gender and adult/teen privacy metadata')
    browser.close()
