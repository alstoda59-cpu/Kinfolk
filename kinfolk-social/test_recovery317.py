"""Recovery317: browser-enforced Vercel preview backend isolation.
All requests are intercepted with synthetic fixtures. No real backend is contacted.
"""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).parent
guard=(ROOT/'kinfolk-preview-isolation.js').read_text()
assert 'Content-Security-Policy' in guard
LIVE='https://zojajuzmfjpvubzibzgg.supabase.co/rest/v1/profiles'
HTML=f'''<!doctype html><html><head><meta charset="utf-8">
<script src="/kinfolk-preview-isolation.js"></script>
<script>fetch({LIVE!r}).catch(()=>{{}});</script>
</head><body><main id="baseline">Kinfolk test fixture</main></body></html>'''

def inspect(browser,origin,blocked):
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    outbound=[]
    errors=[]
    def route_handler(route):
        url=route.request.url
        if url==origin+'/':
            route.fulfill(status=200,content_type='text/html',body=HTML)
        elif url==origin+'/kinfolk-preview-isolation.js':
            route.fulfill(status=200,content_type='application/javascript',body=guard)
        elif url==LIVE:
            outbound.append(url)
            route.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body='[]')
        else:
            route.abort()
    page.route('**/*',route_handler)
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(origin+'/',wait_until='load')
    page.wait_for_timeout(100)
    assert page.evaluate('Boolean(window.__kinfolkPreviewBackendBlocked)') is blocked
    overlay=page.locator('#kf317PreviewBlocked')
    if blocked:
        assert overlay.is_visible()
        assert overlay.get_attribute('role')=='alert'
        assert 'shared live Kinfolk backend' in overlay.inner_text()
        assert not outbound,'CSP failed to block live Supabase fetch: '+repr(outbound)
        rect=overlay.bounding_box()
        assert rect and rect['width']>=380 and rect['height']>=820
    else:
        assert overlay.count()==0
        assert outbound==[LIVE],'nonpreview control should reach only intercepted synthetic request'
    assert not errors,errors
    page.close()

with sync_playwright() as p:
    for engine in os.environ.get('KINFOLK_TEST_ENGINES','chromium,webkit').split(','):
        browser=getattr(p,engine).launch(headless=True)
        inspect(browser,'https://kinfolk-social-demo-synthetic.vercel.app',True)
        inspect(browser,'http://localhost:3838',False)
        browser.close()
        print('PASS Recovery317',engine,'preview CSP blocked live fetch; native/local host unaffected')
