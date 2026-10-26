"""Mobile logout against the full app's mocked SDK; blocks all network traffic."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
P=Path(__file__).parent
ns={'__file__':str(P/'test_recovery129.py')}
exec(compile((P/'test_recovery129.py').read_text().split('with sync_playwright() as p:')[0],str(P/'test_recovery129.py'),'exec'),ns)
with sync_playwright() as p:
    for engine in os.environ.get('KINFOLK_TEST_ENGINES','chromium,webkit').split(','):
        browser=getattr(p,engine).launch(headless=True)
        page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        page.route('**/*',lambda route:route.abort())
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.set_content(ns['test_html'](),wait_until='load')
        page.locator('#kf73Email').fill('qa@example.test')
        page.locator('#kf73Password').fill('valid-long-password-123')
        page.locator('.kf73Primary').click()
        page.locator('#main').wait_for(state='visible')
        page.evaluate("window.__originalSignOut=window.__kfMock.client.auth.signOut;window.__kfMock.client.auth.signOut=async()=>({error:{message:'Synthetic offline failure'}})")
        assert page.evaluate('logout()') is False
        assert page.locator('#main').count()==1
        assert page.evaluate('state.user.id')=='11111111-1111-4111-8111-111111111111'
        assert 'Could not finish logging out' in page.locator('#toast').inner_text()
        page.evaluate('window.__kfMock.client.auth.signOut=window.__originalSignOut')
        assert page.evaluate('logout()') is True
        page.locator('#kf73Email').wait_for(state='visible')
        assert page.evaluate('state.user') is None
        assert page.locator('#main').count()==0
        assert page.evaluate('state.likes.size+state.comments.size+state.subscriptions.size')==0
        assert page.evaluate("sessionStorage.getItem('kinfolk_session_tab')") is None
        assert not errors,errors
        print('PASS Recovery222',engine,'mobile logout failure, retry and state cleanup')
        browser.close()
