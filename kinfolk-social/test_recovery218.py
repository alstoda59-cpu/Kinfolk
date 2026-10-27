"""Recovery218 mocked mobile Chromium signup smoke; no live accounts."""
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
    page.wait_for_timeout(300)
    for selector in ['#kf217Username','#kf217ConfirmPassword','#kf79Birthdate','#kf218ProfileSetup','#kf218Review']:
        assert page.locator(selector).count()==1,selector
    page.locator('#kf73Name').fill('Mobile QA')
    page.locator('#kf217Username').fill('mobile_qa')
    page.locator('#kf73Email').fill('mobile@example.test')
    page.locator('#kf79Birthdate').fill('2000-01-01')
    page.locator('#kf73Password').fill('secure12345!')
    # Valid-length mismatch must reach the app's matching validation, not browser minLength.
    page.locator('#kf217ConfirmPassword').fill('wrong123456!')
    page.locator('.kf73Primary').click()
    page.wait_for_timeout(130)
    assert page.evaluate('window.__kfMock.signupCalls')==0
    assert 'match' in page.locator('.kf73Msg').inner_text().lower()
    page.locator('#kf217ConfirmPassword').fill('secure12345!')
    page.locator('#kf218ProfileSetup summary').click()
    page.locator('#kf218Bio').fill('Music and game nights')
    page.locator('#kf218Language').select_option('es')
    page.locator('input[name="kf218Interest"][value="gaming"]').check()
    page.locator('input[name="kf218Interest"][value="music"]').check()
    page.evaluate("window.__recovery218Signup=window.__kfMock.client.auth.signUp;window.__kfMock.client.auth.signUp=async a=>{window.__recovery218Args=a;return window.__recovery218Signup(a)}")
    page.locator('.kf73Primary').click()
    page.wait_for_timeout(230)
    assert page.evaluate('window.__kfMock.signupCalls')==1
    data=page.evaluate('window.__recovery218Args.options.data')
    assert data['username']=='mobile_qa' and data['bio']=='Music and game nights'
    # These two names are consumed by the existing Supabase signup triggers.
    assert data['profile_display_name']=='Mobile QA'
    assert data['profile_bio']=='Music and game nights'
    assert data['preferred_language']=='es' and data['interests']==['gaming','music']
    assert not errors,errors
    browser.close()
    print('PASS mobile signup DOM and script execution')
