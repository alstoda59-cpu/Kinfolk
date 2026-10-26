"""Recovery225: mobile network-failure startup recovery, without a real backend.
Tests the actual inline recovery script embedded in Kinfolk index.html.
"""
from pathlib import Path
import os,re
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).parent
html=(ROOT/'index.html').read_text()
match=re.search(r'<script id="kinfolk-auth-sdk-recovery">([\s\S]*?)</script>',html)
assert match,'Kinfolk authentication SDK startup recovery must be present'
recovery=match.group(0)

def fixture(healthy=False):
    fake='<script>window.supabase={createClient(){return {}}};</script>' if healthy else ''
    return ('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            +fake+recovery+'</head><body><main id="baseline">Kinfolk login</main></body></html>')

with sync_playwright() as p:
    for engine in os.environ.get('KINFOLK_TEST_ENGINES','chromium,webkit').split(','):
        browser=getattr(p,engine).launch(headless=True)
        for width,height in [(390,844),(375,812)]:
            page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True)
            page.route('**/*',lambda route:route.abort())
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_content(fixture(),wait_until='load')
            panel=page.locator('#kf225AuthRecovery')
            panel.wait_for(state='visible')
            assert panel.get_attribute('role')=='alert'
            assert panel.get_by_role('heading',name="Kinfolk couldn't start").is_visible()
            retry=panel.get_by_role('button',name='Try again')
            assert retry.is_visible()
            rect=retry.bounding_box()
            assert rect and rect['height']>=44
            assert rect['x']>=0 and rect['x']+rect['width']<=width+1
            assert rect['y']>=0 and rect['y']+rect['height']<=height+1
            assert 'Your account has not been changed' in panel.inner_text()
            assert not errors,errors
            page.close()
        healthy=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        healthy.route('**/*',lambda route:route.abort())
        healthy.set_content(fixture(healthy=True),wait_until='load')
        assert healthy.locator('#kf225AuthRecovery').count()==0
        assert healthy.locator('#baseline').is_visible()
        healthy.close()
        print('PASS Recovery225',engine,'responsive offline auth SDK recovery and normal startup')
        browser.close()
