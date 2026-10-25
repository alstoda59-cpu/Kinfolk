'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('kinfolk-social/kinfolk-reels159.js','utf8');
test('mobile Shorts uses a full-height snapping vertical feed',()=>{
 assert.match(source,/height:calc\(100dvh - 152px - env\(safe-area-inset-bottom,0px\)\)/);
 assert.match(source,/scroll-snap-type:y mandatory/);
 assert.match(source,/\.kf159-slide video\{width:100%;height:100%;object-fit:cover/);
});
test('Shorts retains existing interactive actions and playback',()=>{
 for(const action of ['Like ','Dislike ','Comments','Share','Remix','Save','Download','Sound'])
   assert.ok(source.includes(action),'missing '+action);
 assert.match(source,/kf159TogglePlayback/);
 assert.match(source,/ArrowDown/);
 assert.match(source,/ArrowUp/);
});
test('Shorts preserves reduced motion and screen visibility safeguards',()=>{
 assert.match(source,/prefers-reduced-motion:reduce/);
 assert.match(source,/visibilitychange/);
 assert.match(source,/pauseOthers/);
});
