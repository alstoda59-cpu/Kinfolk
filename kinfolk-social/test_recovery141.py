"""Recovery141: mobile keyboard focus and reduced-motion browser regressions.
No live Supabase requests; uses the existing synthetic HTML fixture.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

P=Path(__file__).parent
fixture=(P/'test_recovery129.py').read_text().split('with sync_playwright() as p:')[0]
ns={'__file__':str(P/'test_recovery129.py')}
exec(compile(fixture,str(P/'test_recovery129.py'),'exec'),ns)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage'])
    normal=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    normal.set_content(ns['test_html'](),wait_until='load',timeout=30000)
    normal.wait_for_timeout(600)
    normal.locator('#kf73Email').focus()
    focus=normal.locator('#kf73Email').evaluate("""element=>({
      visible:element.matches(':focus-visible'),
      width:getComputedStyle(element).outlineWidth,
      style:getComputedStyle(element).outlineStyle
    })""")
    assert focus['visible'],f'email field not keyboard-focus visible: {focus}'
    assert focus['style']=='solid' and float(focus['width'].replace('px',''))>=3,focus
    assert normal.locator('#authForm').count()==1
    normal.close()

    reduced=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce')
    reduced.set_content(ns['test_html'](),wait_until='load',timeout=30000)
    timings=reduced.evaluate("""() => {
      const element=document.createElement('div');
      element.style.animation='kinfolk-qa-spin 5s linear infinite';
      element.style.transition='opacity 2s';
      document.body.appendChild(element);
      const style=getComputedStyle(element);
      return {motion:matchMedia('(prefers-reduced-motion:reduce)').matches,
        animation:style.animationDuration,iterations:style.animationIterationCount,
        transition:style.transitionDuration};
    }""")
    assert timings['motion'],timings
    assert timings['animation'] in ('1e-05s','0.00001s','0s'),timings
    assert timings['iterations']=='1',timings
    assert timings['transition'] in ('1e-05s','0.00001s','0s'),timings
    assert reduced.locator('#authForm').count()==1
    print('PASS mobile keyboard focus ring and reduced-motion accessibility rules',focus,timings)
    browser.close()
