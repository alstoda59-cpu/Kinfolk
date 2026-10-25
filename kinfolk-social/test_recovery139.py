"""Recovery139: Web Storage denial cannot strand login or silently restore a session.
All auth and database behavior is synthetic; no live backend is contacted.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

P=Path(__file__).parent
fixture=(P/'test_recovery129.py').read_text().split('with sync_playwright() as p:')[0]
ns={'__file__':str(P/'test_recovery129.py')}
exec(compile(fixture,str(P/'test_recovery129.py'),'exec'),ns)

def html(restored=False, blocked=False):
    source=ns['test_html']()
    if restored:
        before="let session=null;const listeners=[]"
        after="let session={user,access_token:'fake',refresh_token:'fake'};const listeners=[]"
        assert before in source
        source=source.replace(before,after,1)
    if blocked:
        before="const sb=window.supabase.createClient"
        after="""localStorage.getItem=()=>{throw new DOMException('Storage blocked','SecurityError')};
sessionStorage.getItem=()=>{throw new DOMException('Storage blocked','SecurityError')};
const sb=window.supabase.createClient"""
        assert before in source
        source=source.replace(before,after,1)
    return source

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage'])
    for restored,blocked,expected_main in [(False,True,False),(True,True,False),(True,False,True)]:
        page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        page.set_content(html(restored,blocked),wait_until='load',timeout=30000)
        page.wait_for_timeout(1700)
        assert (page.locator('#main').count()==1)==expected_main,(restored,blocked,'main')
        if expected_main:
            assert page.evaluate('window.state.user?.id')=='11111111-1111-4111-8111-111111111111'
        else:
            assert page.locator('#authForm').count()==1,(restored,blocked,'login form missing')
            assert 'Welcome back' in page.locator('.kf73Title').inner_text()
            if restored and blocked:
                assert page.evaluate('window.__kfMock.session') is None,'blocked storage must not auto-restore an unchecked session'
        page.close()
    print('PASS blocked storage: login available, restored session denied; normal storage: restored session opens app')
    browser.close()
