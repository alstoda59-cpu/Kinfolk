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
