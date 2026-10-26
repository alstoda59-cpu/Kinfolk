"""Offline regression: blocked preference storage must not silently change session policy.

No real Supabase requests or user accounts are involved.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
P=Path(__file__).parent
fixture=(P/'test_recovery129.py').read_text().split('with sync_playwright() as p:')[0]
ns={'__file__':str(P/'test_recovery129.py')}
exec(compile(fixture,str(P/'test_recovery129.py'),'exec'),ns)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.set_content(ns['test_html'](),wait_until='load',timeout=30000)
    page.wait_for_timeout(900)
    page.locator('#kf73Email').fill('qa@example.test')
    page.locator('#kf73Password').fill('valid-long-password-123')
    page.evaluate("""() => { localStorage.setItem=()=>{throw new DOMException('Quota exceeded','QuotaExceededError')}; }""")
    page.locator('.kf73Primary').click()
    page.wait_for_timeout(1800)
    assert page.locator('#main').count()==0,'blocked storage must not open an account'
    assert page.evaluate('window.state.user') is None
    assert page.evaluate('window.__kfMock.session') is None
    assert 'login preference' in page.locator('.kf73Msg').inner_text().lower()
    assert page.locator('.kf73Primary').is_enabled()
    # Unrelated legacy shell scripts still throw under this extreme condition.
    # Track errors separately rather than pretending the entire app is resilient.
    print('PASS blocked preference storage prevents login; legacy page errors:',errors[:4])
    browser.close()
