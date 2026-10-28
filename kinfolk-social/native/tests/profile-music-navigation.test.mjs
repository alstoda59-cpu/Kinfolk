import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
const phase81=readFileSync(new URL('../kinfolk-phase81.js',import.meta.url),'utf8');
test('main navigation tears down profile music before rendering another screen',()=>{
 const match=html.match(/function setView\\(v\\)\\{[^\\n]+/);
 assert.ok(match,'setView implementation exists');
 assert.match(match[0],/if\\(v!=='profile'\\)window\\.kf81StopProfileMusic\\?\\.\\(\\)/);
 assert.ok(match[0].indexOf('kf81StopProfileMusic')<match[0].indexOf('renderApp()'));
});
test('profile music teardown silences legacy audio elements and removes old YouTube player',()=>{
 const body=phase81.slice(phase81.indexOf('function stopMusic(){'),phase81.indexOf('function attachControl('));
 assert.match(body,/querySelectorAll\\('\\.kf51Music audio'\\)/);
 assert.match(body,/audio\\.pause\\(\\)/);
 assert.match(body,/audio\\.autoplay=false/);
 assert.match(body,/getElementById\\('kf54YT'\\)\\?\\.remove\\(\\)/);
});
