"""Recovery138: stalled authentication must time out and let a user retry.
Offline browser only. No real Supabase account, credentials, or requests.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
P=Path(__file__).parent
fixture=(P/'test_recovery129.py').read_text().split('with sync_playwright() as p:')[0]
ns={'__file__':str(P/'test_recovery129.py')}
exec(compile(fixture,str(P/'test_recovery129.py'),'exec'),ns)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(ns['test_html'](),wait_until='load',timeout=30000)
    page.wait_for_timeout(700)
    page.evaluate("""() => {
      const original=window.fetch;
      window.__stallCount=0;
      window.fetch=(url,opts)=>{
        if(String(url).includes('/auth/v1/token')){
          window.__stallCount++;
          return new Promise((resolve,reject)=>{
            opts.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
          });
        }
        return original(url,opts);
      };
    }""")
    page.locator('#kf73Email').fill('synthetic@example.test')
    page.locator('#kf73Password').fill('valid-long-password-123')
    page.locator('.kf73Primary').click()
    page.wait_for_timeout(15900)
    assert page.evaluate('window.__stallCount')==1
    assert page.locator('.kf73Primary').is_enabled(),'stalled login left button disabled'
    assert 'timed out' in page.locator('.kf73Msg').inner_text().lower()
    assert page.locator('#main').count()==0
    assert not errors,errors
    print('PASS stalled token request aborted after 15 seconds and user can retry')
    browser.close()
