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
    assert not errors,errors
    browser.close()
    print('PASS mobile signup DOM and script execution')
