"""Recovery143: password recovery must not send native localhost as email redirect.
Uses the existing synthetic browser fixture; no real emails or backend requests.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

P=Path(__file__).parent
fixture=(P/'test_recovery129.py').read_text().split('with sync_playwright() as p:')[0]
ns={'__file__':str(P/'test_recovery129.py')}
exec(compile(fixture,str(P/'test_recovery129.py'),'exec'),ns)

with sync_playwright() as p:
    browser=p.chromium.launch(
        headless=True,
        executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,
        args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(ns['test_html'](),wait_until='load',timeout=30000)
    page.wait_for_timeout(750)
    assert page.locator('#authForm').count()==1
    assert page.locator('.kf73Forgot').count()==1,'forgot-password button missing'
    page.evaluate("""() => {
        window.__resetCalls=[];
        window.__kfMock.client.auth.resetPasswordForEmail=async (email,options)=>{
            window.__resetCalls.push({email,options});
            return {error:null};
        };
    }""")
    page.locator('.kf73Forgot').click()
    page.wait_for_timeout(100)
    assert page.evaluate('window.__resetCalls.length')==0,'missing email must not trigger reset'
    assert 'email' in page.locator('.kf73Msg').inner_text().lower()
    page.locator('#kf73Email').fill('recovery@example.test')

    for callback,expected in [
        ('https://localhost/auth/recover',None),
        ('https://preview.localhost/auth/recover',None),
        ('https://127.0.0.1/auth/recover',None),
        ('http://example.test/auth/recover',None),
        ('https://example.test/auth/recover','https://example.test/auth/recover')
    ]:
        page.evaluate('(callback)=>window.KINFOLK_PASSWORD_RESET_REDIRECT_URL=callback',callback)
        page.locator('.kf73Forgot').click()
        page.wait_for_timeout(100)
        record=page.evaluate('window.__resetCalls.at(-1)')
        assert record['email']=='recovery@example.test',record
        redirect=record['options'].get('redirectTo')
        assert redirect==expected,(callback,record)
        assert 'sent' in page.locator('.kf73Msg').inner_text().lower()

    # No explicit callback on about:blank should fall back to the Supabase
    # project Site URL, rather than using an unusable native-like origin.
    page.evaluate('delete window.KINFOLK_PASSWORD_RESET_REDIRECT_URL')
    page.locator('.kf73Forgot').click()
    page.wait_for_timeout(100)
    assert 'redirectTo' not in page.evaluate('window.__resetCalls.at(-1).options')
    assert not errors,errors[:5]
    print('PASS password recovery missing-email gate, HTTPS callback, native localhost exclusion; no backend or email sent')
    browser.close()
