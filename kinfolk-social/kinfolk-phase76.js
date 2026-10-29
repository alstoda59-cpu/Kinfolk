
;
(function(){const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const one=async t=>{const r=await sb.from(t).select('*').eq('user_id',state.user.id).maybeSingle();return r.error?null:r.data};window.openKinfolkSettings=async function(){const p=state.profile||{},[us,pref,np]=await Promise.all([one('user_settings'),one('kinfolk_user_preferences'),one('notification_preferences')]),lang=(pref?.locale||'en').toLowerCase();modal('Settings & activity',`<form id="kinfolkSettingsForm" class="kinfolkSettingsForm"><div class="settingsHero"><div><b>${H(p.display_name||p.username||'Your account')}</b><div class="muted">@${H(p.username||'')}</div></div><span>⚙️</span></div><div class="settingsGroup"><div class="settingsTitle">Account & profile</div><label class="settingsRow"><span><b>Private account</b><small>Approve people before they can see private profile content.</small></span><input id="setPrivate" type="checkbox" ${p.is_private?'checked':''}></label><label class="settingsStack"><span><b>Profile location</b><small>Optional. Leave blank to hide it.</small></span><input class="field" id="setLocation" maxlength="80" value="${H(p.location_text||'')}" placeholder="City, state or region"></label><label class="settingsRow"><span><b>Allow location on posts</b><small>You choose whether location can be attached when posting.</small></span><input id="setPostLocation" type="checkbox" ${pref?.allow_post_location?'checked':''}></label></div><div class="settingsGroup"><div class="settingsTitle">Language</div><select class="field" id="setLocale"><option value="en" ${lang==='en'?'selected':''}>English</option><option value="es" ${lang==='es'?'selected':''}>Español</option><option value="fr" ${lang==='fr'?'selected':''}>Français</option><option value="de" ${lang==='de'?'selected':''}>Deutsch</option><option value="pt" ${lang==='pt'?'selected':''}>Português</option><option value="ja" ${lang==='ja'?'selected':''}>日本語</option><option value="ko" ${lang==='ko'?'selected':''}>한국어</option></select></div><div class="settingsGroup"><div class="settingsTitle">Messages & privacy</div><label class="settingsStack"><span><b>Who can message you</b></span><select class="field" id="setMessages"><option value="friends" ${(us?.allow_messages||'friends')==='friends'?'selected':''}>Friends</option><option value="everyone" ${us?.allow_messages==='everyone'?'selected':''}>Everyone</option><option value="nobody" ${us?.allow_messages==='nobody'?'selected':''}>No one</option></select></label><label class="settingsRow"><span><b>Disappearing messages by default</b><small>New direct messages can default to disappear after being read.</small></span><input id="setDisappear" type="checkbox" ${pref?.disappearing_messages_default?'checked':''}></label><label class="settingsRow"><span><b>Show online status</b></span><input id="setOnline" type="checkbox" ${us?.show_online!==false?'checked':''}></label></div><div class="settingsGroup"><div class="settingsTitle">Notifications</div><label class="settingsRow"><span><b>Push notifications</b></span><input id="setPush" type="checkbox" ${np?.push_enabled!==false?'checked':''}></label><label class="settingsRow"><span><b>Email notifications</b></span><input id="setEmail" type="checkbox" ${np?.email_enabled?'checked':''}></label><label class="settingsRow"><span><b>Post activity</b></span><input id="setNotifyPosts" type="checkbox" ${us?.notify_posts!==false?'checked':''}></label><label class="settingsRow"><span><b>Reels activity</b></span><input id="setNotifyReels" type="checkbox" ${us?.notify_reels!==false?'checked':''}></label></div><div class="settingsGroup"><div class="settingsTitle">Appearance & playback</div><label class="settingsStack"><span><b>Profile layout</b></span><select class="field" id="setLayout"><option value="classic">Classic</option><option value="animated">Animated</option><option value="minimal">Minimal</option><option value="retro">Retro</option></select></label><label class="settingsRow"><span><b>Animate profile layout</b></span><input id="setAnimated" type="checkbox" ${p.profile_animated?'checked':''}></label><label class="settingsRow"><span><b>Autoplay videos</b></span><input id="setAutoplay" type="checkbox" ${us?.autoplay_video?'checked':''}></label><label class="settingsRow"><span><b>Profile music</b></span><input id="setMusic" type="checkbox" ${us?.profile_music_enabled!==false?'checked':''}></label></div><div class="settingsGroup"><div class="settingsTitle">Safety</div><div class="settingsInfo">Teen accounts keep stricter privacy and mature-content protections. Blocking continues to remove people from discovery and suggestions.</div></div><button class="btn primary full" id="saveKinfolkSettings">Save settings</button></form>`);$('#setLayout').value=p.profile_layout||'classic';$('#kinfolkSettingsForm').onsubmit=async e=>{e.preventDefault();const save=$('#saveKinfolkSettings');save.disabled=true;save.textContent='Saving…';const [a,b,c,d]=await Promise.all([sb.from('profiles').update({is_private:$('#setPrivate').checked,location_text:$('#setLocation').value.trim()||null,profile_layout:$('#setLayout').value,profile_animated:$('#setAnimated').checked}).eq('id',state.user.id).select().single(),sb.from('user_settings').upsert({user_id:state.user.id,show_online:$('#setOnline').checked,allow_messages:$('#setMessages').value,notify_posts:$('#setNotifyPosts').checked,notify_reels:$('#setNotifyReels').checked,autoplay_video:$('#setAutoplay').checked,profile_music_enabled:$('#setMusic').checked},{onConflict:'user_id'}),sb.from('kinfolk_user_preferences').upsert({user_id:state.user.id,locale:$('#setLocale').value,allow_post_location:$('#setPostLocation').checked,disappearing_messages_default:$('#setDisappear').checked},{onConflict:'user_id'}),sb.from('notification_preferences').upsert({user_id:state.user.id,push_enabled:$('#setPush').checked,email_enabled:$('#setEmail').checked},{onConflict:'user_id'})]);const er=a.error||b.error||c.error||d.error;if(er){save.disabled=false;save.textContent='Save settings';return toast(er.message,'danger')}state.profile=a.data;state.profiles.set(a.data.id,a.data);closeModal();await renderApp();toast('Settings saved','good')}};async function pymk(root){if(!root||!state.user)return;const {data,error}=await sb.rpc('people_you_may_know',{max_results:12});if(error||!data?.length){root.innerHTML='';return}const hidden=window._kinfolkSuggestionHidden||(window._kinfolkSuggestionHidden=new Set()),people=data.filter(x=>!hidden.has(x.id));if(!people.length){root.innerHTML='';return}const cards=[];for(const person of people){const av=await avatarHtml({id:person.id,username:person.username,display_name:person.display_name,avatar_url:person.avatar_url},'md'),m=Number(person.mutual_count||0);cards.push(`<div class="peopleMayKnowCard" data-suggestion-id="${person.id}">${av}<b>${esc(person.display_name||person.username)}</b><div class="muted">${m?`${m} mutual connection${m===1?'':'s'}`:`@${esc(person.username)}`}</div><div class="peopleMayKnowActions"><button class="btn primary" onclick="sendFriend('${person.id}')">Add friend</button><button class="btn suggestionRemove" onclick="hidePeopleSuggestion('${person.id}')">×</button></div></div>`)}root.innerHTML=`<div class="card peopleMayKnow"><div class="peopleMayKnowHead"><h3>People you may know</h3><button class="linkBtn" onclick="go('friends')">See all</button></div><div class="peopleMayKnowRail">${cards.join('')}</div></div>`}window.hidePeopleSuggestion=id=>{const h=window._kinfolkSuggestionHidden||(window._kinfolkSuggestionHidden=new Set());h.add(id);document.querySelector(`[data-suggestion-id="${id}"]`)?.remove()};const rp=window.renderProfile;if(typeof rp==='function')window.renderProfile=async function(main,id){await rp(main,id);if(id===state.user?.id){let mount=document.querySelector('#peopleMayKnowMount');if(!mount){mount=document.createElement('div');mount.id='peopleMayKnowMount';(document.querySelector('#profileContent')?.parentElement||main).appendChild(mount)}await pymk(mount)}};const s=document.createElement('style');s.textContent='.kinfolkSettingsForm{display:grid;gap:12px}.settingsHero{display:flex;align-items:center;justify-content:space-between;padding:12px 2px}.settingsHero>span{font-size:28px}.settingsGroup{border:1px solid var(--line,#34343d);border-radius:16px;padding:12px;background:rgba(255,255,255,.025)}.settingsTitle{font-weight:800;margin-bottom:8px}.settingsRow,.settingsStack{display:flex;gap:12px;padding:11px 0;border-top:1px solid rgba(255,255,255,.07)}.settingsGroup>.settingsRow:nth-child(2),.settingsGroup>.settingsStack:nth-child(2){border-top:0}.settingsRow{align-items:center;justify-content:space-between}.settingsRow>span,.settingsStack>span{display:grid;gap:3px}.settingsRow small,.settingsStack small{display:block;color:var(--muted,#aaa);font-size:12px;line-height:1.35;font-weight:400}.settingsStack{flex-direction:column}.settingsRow input[type=checkbox]{width:22px;height:22px;accent-color:var(--accent,#e85a9b)}.settingsInfo{font-size:13px;line-height:1.5;color:var(--muted,#aaa)}.peopleMayKnow{margin-top:14px;overflow:hidden}.peopleMayKnowHead{display:flex;align-items:center;justify-content:space-between;margin:0 2px 10px}.peopleMayKnowHead h3{margin:0;font-size:17px}.peopleMayKnowRail{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 8px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none}.peopleMayKnowRail::-webkit-scrollbar{display:none}.peopleMayKnowCard{flex:0 0 154px;scroll-snap-align:start;border:1px solid var(--line,#34343d);border-radius:16px;padding:13px 10px;background:rgba(255,255,255,.035);text-align:center}.peopleMayKnowCard .avatar{margin:0 auto 9px}.peopleMayKnowCard b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.peopleMayKnowCard .muted{font-size:12px;min-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.peopleMayKnowActions{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:10px}.suggestionRemove{min-width:34px;padding:7px!important;font-size:18px;line-height:1}';document.head.appendChild(s)})();
;

;
(function(){const old=window.openKinfolkSettings;if(typeof old!=='function')return;const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const one=async t=>{const r=await sb.from(t).select('*').eq('user_id',state.user.id).maybeSingle();return r.error?null:r.data};window.openKinfolkSettings=async function(){const p=state.profile||{},[us,pref,np]=await Promise.all([one('user_settings'),one('kinfolk_user_preferences'),one('notification_preferences')]),lang=(pref?.locale||'en').toLowerCase();modal('Settings & activity',`<form id="kinfolkSettingsForm" class="kinfolkSettingsForm"><div class="settingsHero"><div><b>${H(p.display_name||p.username||'Your account')}</b><div class="muted">@${H(p.username||'')}</div></div><span>⚙️</span></div><div class="settingsGroup"><div class="settingsTitle">Account & profile</div><label class="settingsRow"><span><b>Private account</b><small>Approve people before they can see private profile content.</small></span><input id="setPrivate" type="checkbox" ${p.is_private?'checked':''}></label><label class="settingsStack"><span><b>Profile location</b><small>Optional. Leave blank to hide it.</small></span><input class="field" id="setLocation" maxlength="80" value="${H(p.location_text||'')}" placeholder="City, state or region"></label><label class="settingsRow"><span><b>Allow location on posts</b><small>You decide when a location can be attached.</small></span><input id="setPostLocation" type="checkbox" ${pref?.allow_post_location?'checked':''}></label></div><div class="settingsGroup"><div class="settingsTitle">Language</div><select class="field" id="setLocale"><option value="en" ${lang==='en'?'selected':''}>English</option><option value="es" ${lang==='es'?'selected':''}>Español</option><option value="fr" ${lang==='fr'?'selected':''}>Français</option><option value="de" ${lang==='de'?'selected':''}>Deutsch</option><option value="pt" ${lang==='pt'?'selected':''}>Português</option><option value="ja" ${lang==='ja'?'selected':''}>日本語</option><option value="ko" ${lang==='ko'?'selected':''}>한국어</option></select></div><div class="settingsGroup"><div class="settingsTitle">Messages & privacy</div><label class="settingsStack"><span><b>Who can message you</b></span><select class="field" id="setMessages"><option value="friends" ${(us?.allow_messages||'friends')==='friends'?'selected':''}>Friends</option><option value="everyone" ${us?.allow_messages==='everyone'?'selected':''}>Everyone</option><option value="nobody" ${us?.allow_messages==='nobody'?'selected':''}>No one</option></select></label><label class="settingsRow"><span><b>Disappearing messages by default</b><small>New direct messages can default to disappear after being read.</small></span><input id="setDisappear" type="checkbox" ${pref?.disappearing_messages_default?'checked':''}></label><label class="settingsRow"><span><b>Show online status</b></span><input id="setOnline" type="checkbox" ${us?.show_online!==false?'checked':''}></label></div><div class="settingsGroup"><div class="settingsTitle">Notifications</div><label class="settingsRow"><span><b>Push notifications</b></span><input id="setPush" type="checkbox" ${np?.push_enabled!==false?'checked':''}></label><label class="settingsRow"><span><b>Email notifications</b></span><input id="setEmail" type="checkbox" ${np?.email_enabled?'checked':''}></label><label class="settingsRow"><span><b>Post activity</b></span><input id="setNotifyPosts" type="checkbox" ${us?.notify_posts!==false?'checked':''}></label><label class="settingsRow"><span><b>Reels activity</b></span><input id="setNotifyReels" type="checkbox" ${us?.notify_reels!==false?'checked':''}></label></div><div class="settingsGroup"><div class="settingsTitle">Appearance & playback</div><label class="settingsStack"><span><b>Layout color</b><small>Choose the accent color used across your profile.</small></span><div class="colorPickerRow"><input id="setAccent" type="color" value="${H(p.accent_color||'#e85a9b')}"><input id="setAccentText" class="field" maxlength="7" value="${H(p.accent_color||'#e85a9b')}" placeholder="#e85a9b"></div></label><label class="settingsStack"><span><b>Profile layout</b></span><select class="field" id="setLayout"><option value="classic">Classic</option><option value="animated">Animated</option><option value="minimal">Minimal</option><option value="retro">Retro</option></select></label><label class="settingsRow"><span><b>Animate profile layout</b></span><input id="setAnimated" type="checkbox" ${p.profile_animated?'checked':''}></label><label class="settingsRow"><span><b>Autoplay videos</b></span><input id="setAutoplay" type="checkbox" ${us?.autoplay_video?'checked':''}></label><label class="settingsRow"><span><b>Profile music</b></span><input id="setMusic" type="checkbox" ${us?.profile_music_enabled!==false?'checked':''}></label></div><div class="settingsGroup"><div class="settingsTitle">How people interact with you</div><button type="button" class="settingsNav" onclick="go('friends')"><span>Friends & following</span><b>›</b></button><button type="button" class="settingsNav" onclick="go('notifications')"><span>Notifications</span><b>›</b></button><button type="button" class="settingsNav" onclick="go('messages')"><span>Messages and replies</span><b>›</b></button></div><div class="settingsGroup"><div class="settingsTitle">What you see</div><button type="button" class="settingsNav" onclick="go('search')"><span>Discover people</span><b>›</b></button><button type="button" class="settingsNav" onclick="go('reels')"><span>Reels preferences</span><b>›</b></button><button type="button" class="settingsNav" onclick="go('channels')"><span>Channels & subscriptions</span><b>›</b></button></div><div class="settingsGroup"><div class="settingsTitle">Safety & control</div><div class="settingsInfo">Teen accounts keep stricter privacy and mature-content protections. Blocking continues to remove people from discovery and suggestions.</div><button type="button" class="settingsNav" onclick="toast('Blocked accounts management is next','good')"><span>Blocked accounts</span><b>›</b></button><button type="button" class="settingsNav" onclick="openHelpCenter()"><span>Help & support</span><b>›</b></button><button type="button" class="settingsNav" onclick="openAboutKinfolk()"><span>About Kinfolk</span><b>›</b></button></div><button class="btn primary full" id="saveKinfolkSettings">Save settings</button></form>`);$('#setLayout').value=p.profile_layout||'classic';const ac=$('#setAccent'),act=$('#setAccentText');if(ac&&act){ac.oninput=()=>{act.value=ac.value;document.documentElement.style.setProperty('--accent',ac.value)};act.oninput=()=>{if(/^#[0-9a-fA-F]{6}$/.test(act.value)){ac.value=act.value;document.documentElement.style.setProperty('--accent',act.value)}}}$('#kinfolkSettingsForm').onsubmit=async e=>{e.preventDefault();const save=$('#saveKinfolkSettings');save.disabled=true;save.textContent='Saving…';const accent=($('#setAccentText').value||$('#setAccent').value).trim();if(!/^#[0-9a-fA-F]{6}$/.test(accent)){save.disabled=false;save.textContent='Save settings';return toast('Use a valid 6-digit color','danger')}const [a,b,c,d]=await Promise.all([sb.from('profiles').update({is_private:$('#setPrivate').checked,location_text:$('#setLocation').value.trim()||null,profile_layout:$('#setLayout').value,profile_animated:$('#setAnimated').checked,accent_color:accent}).eq('id',state.user.id).select().single(),sb.from('user_settings').upsert({user_id:state.user.id,show_online:$('#setOnline').checked,allow_messages:$('#setMessages').value,notify_posts:$('#setNotifyPosts').checked,notify_reels:$('#setNotifyReels').checked,autoplay_video:$('#setAutoplay').checked,profile_music_enabled:$('#setMusic').checked},{onConflict:'user_id'}),sb.from('kinfolk_user_preferences').upsert({user_id:state.user.id,locale:$('#setLocale').value,allow_post_location:$('#setPostLocation').checked,disappearing_messages_default:$('#setDisappear').checked},{onConflict:'user_id'}),sb.from('notification_preferences').upsert({user_id:state.user.id,push_enabled:$('#setPush').checked,email_enabled:$('#setEmail').checked},{onConflict:'user_id'})]);const er=a.error||b.error||c.error||d.error;if(er){save.disabled=false;save.textContent='Save settings';return toast(er.message,'danger')}state.profile=a.data;state.profiles.set(a.data.id,a.data);document.documentElement.style.setProperty('--accent',accent);closeModal();await renderApp();toast('Settings saved','good')}};window.openHelpCenter=function(){modal('Help & support',`<div class="settingsGroup"><button class="settingsNav" type="button" onclick="toast('Help Center coming next','good')"><span>Help Center</span><b>›</b></button><button class="settingsNav" type="button" onclick="toast('Report flow coming next','good')"><span>Report a problem</span><b>›</b></button><button class="settingsNav" type="button" onclick="toast('Safety Center coming next','good')"><span>Safety Center</span><b>›</b></button></div>`)};window.openAboutKinfolk=function(){modal('About Kinfolk',`<div class="settingsGroup"><div class="settingsInfo">Kinfolk is built around customizable profiles, friends, Reels, Channels, messaging, privacy and safer discovery.</div><button class="settingsNav" type="button" onclick="toast('Community Guidelines coming next','good')"><span>Community Guidelines</span><b>›</b></button><button class="settingsNav" type="button" onclick="toast('Terms coming next','good')"><span>Terms & privacy</span><b>›</b></button></div>`)};const s=document.createElement('style');s.textContent='.colorPickerRow{display:grid;grid-template-columns:58px 1fr;gap:10px;align-items:center}.colorPickerRow input[type=color]{width:58px;height:44px;border:0;background:transparent;padding:0;border-radius:12px}.settingsNav{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 2px;border:0;border-top:1px solid rgba(255,255,255,.07);background:transparent;color:inherit;text-align:left;font:inherit}.settingsNav:first-of-type{border-top:0}.settingsNav b{font-size:24px;font-weight:400;color:var(--muted,#aaa)}';document.head.appendChild(s)})();
;

;
(function(){
const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const one=async t=>{const r=await sb.from(t).select('*').eq('user_id',state.user.id).maybeSingle();return r.error?null:r.data};
const style=document.createElement('style');style.textContent=`
#kinfolkSettingsScreen{position:fixed;inset:0;z-index:10000;background:var(--bg,#0d0d12);color:var(--text,#fff);overflow:auto;-webkit-overflow-scrolling:touch}.kfsTop{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top)) 16px 10px;background:rgba(13,13,18,.94);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.08)}.kfsBack{border:0;background:transparent;color:inherit;font-size:30px}.kfsTop h2{margin:0;font-size:21px}.kfsBody{max-width:640px;margin:auto;padding:10px 18px calc(44px + env(safe-area-inset-bottom))}.kfsSection{padding:18px 0;border-bottom:1px solid rgba(255,255,255,.09)}.kfsTitle{font-size:12px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:var(--accent,#e85a9b);margin-bottom:10px}.kfsField{display:block;padding:8px 0}.kfsField small,.kfsRow small{display:block;color:var(--muted,#999);margin-top:3px;line-height:1.35}.kfsInput,.kfsSelect{width:100%;box-sizing:border-box;margin-top:7px;border:0;border-bottom:1px solid rgba(255,255,255,.17);border-radius:0;background:transparent;color:inherit;padding:12px 2px;font:inherit}.kfsSelect option{background:#17171e;color:#fff}.kfsRow{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:11px 0}.kfsSwitch{appearance:none;width:46px;height:27px;border-radius:99px;background:#45454f;position:relative;flex:0 0 auto}.kfsSwitch:after{content:'';position:absolute;width:21px;height:21px;left:3px;top:3px;border-radius:50%;background:white;transition:.2s}.kfsSwitch:checked{background:var(--accent,#e85a9b)}.kfsSwitch:checked:after{transform:translateX(19px)}.kfsColorWrap{display:grid;grid-template-columns:84px 1fr;gap:16px;align-items:center;margin-top:10px}.kfsWheel{width:84px;height:84px;padding:0;border:0;background:transparent;border-radius:50%;overflow:hidden}.kfsColorText{width:100%;box-sizing:border-box;border:0;border-bottom:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;padding:10px 2px;font:inherit}.kfsPreview{height:62px;border-radius:18px;margin-top:10px;display:grid;place-items:center;font-weight:900;font-size:20px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 85%,#000),color-mix(in srgb,var(--accent) 42%,#111));box-shadow:0 12px 28px color-mix(in srgb,var(--accent) 22%,transparent)}.kfsSwatches{display:flex;gap:9px;overflow-x:auto;padding:13px 0 4px;scrollbar-width:none}.kfsSwatch{flex:0 0 34px;height:34px;border-radius:50%;border:2px solid rgba(255,255,255,.35)}.kfsNav{width:100%;display:flex;justify-content:space-between;align-items:center;border:0;background:transparent;color:inherit;padding:14px 0;font:inherit;text-align:left}.kfsNav strong{font-size:24px;color:var(--muted,#999);font-weight:400}.kfsSave{position:sticky;bottom:12px;width:100%;border:0;border-radius:99px;padding:14px;background:var(--accent,#e85a9b);color:white;font-weight:900;font-size:16px;box-shadow:0 10px 34px color-mix(in srgb,var(--accent) 35%,transparent)}
.brand,.logo,.kinfolkBrand,[data-brand='kinfolk']{color:var(--accent)!important}.btn.primary,.primaryBtn{background:var(--accent)!important;border-color:var(--accent)!important}.linkBtn,.tab.active,.profileTab.active,.nav .active{color:var(--accent)!important;border-color:var(--accent)!important}
#kinfolkWallpaperLayer{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}#kinfolkWallpaperLayer video,#kinfolkWallpaperLayer .kfwImage{width:100%;height:100%;object-fit:var(--kfw-fit,cover);background-size:var(--kfw-fit,cover);background-position:center;background-repeat:no-repeat}#kinfolkWallpaperLayer .kfwDim{position:absolute;inset:0;background:#000;opacity:var(--kfw-dim,0)}
`;document.head.appendChild(style);
function theme(c){if(!/^#[0-9a-fA-F]{6}$/.test(c||''))return;['--accent','--pink','--brand','--accent-color'].forEach(v=>document.documentElement.style.setProperty(v,c));document.querySelector('meta[name="theme-color"]')?.setAttribute('content',c)}window.applyKinfolkTheme=theme;
window.closeKinfolkSettings=()=>document.getElementById('kinfolkSettingsScreen')?.remove();
function kfsIsTeen(value,now=new Date()){const v=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const [year,month,day]=v.split('-').map(Number);const date=new Date(year,month-1,day);if(date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day)return false;let age=now.getFullYear()-year;if(now.getMonth()+1<month||(now.getMonth()+1===month&&now.getDate()<day))age--;return age>=13&&age<18;}
window.openKinfolkSettings=async function(){if(!state.user)return;const settingsAccountId=state.user.id;const isTeen=kfsIsTeen(state.user.user_metadata?.signup_birthdate);const p=state.profile||{};const [us,pref,np,ex,safe]=await Promise.all([one('user_settings'),one('kinfolk_user_preferences'),one('notification_preferences'),one('kinfolk_profile_extras'),one('kinfolk_safety_settings')]);if(state.user?.id!==settingsAccountId)return;closeKinfolkSettings();const el=document.createElement('div');el.id='kinfolkSettingsScreen';const accent=p.accent_color||'#e85a9b';el.innerHTML=`<div class="kfsTop"><button class="kfsBack" type="button" onclick="closeKinfolkSettings()">‹</button><h2>Settings & customization</h2></div><form id="kfsForm" class="kfsBody"><section class="kfsSection"><div class="kfsTitle">Profile details</div><label class="kfsField"><b>Gender</b><select id="kfsGender" class="kfsSelect"><option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="non-binary">Non-binary</option></select></label><label class="kfsField"><b>Sexual orientation</b><select id="kfsOrientation" class="kfsSelect"><option value="">Prefer not to say</option><option>Straight</option><option>Gay</option><option>Lesbian</option><option>Bisexual</option><option>Pansexual</option><option>Asexual</option><option>Queer</option><option>Questioning</option></select></label><label class="kfsField"><b>Relationship status</b><small>Scroll and choose the status that fits you.</small><select id="kfsRelationship" class="kfsSelect"><option value="">Prefer not to say</option><option>Single</option><option>In a relationship</option><option>Engaged</option><option>Married</option><option>It's complicated</option><option>Separated</option><option>Divorced</option><option>Widowed</option></select></label></section><section class="kfsSection"><div class="kfsTitle">Theme color</div><b>Color wheel</b><small style="display:block;color:var(--muted,#999);margin-top:3px">Changes the whole Kinfolk accent, including buttons, tabs, highlights and signage.</small><div class="kfsColorWrap"><input id="kfsAccent" class="kfsWheel" type="color" value="${H(accent)}"><div><input id="kfsAccentText" class="kfsColorText" maxlength="7" value="${H(accent)}"><div class="kfsPreview">Kinfolk</div></div></div><div class="kfsSwatches">${['#e85a9b','#3b82f6','#22c55e','#a855f7','#f97316','#ef4444','#14b8a6','#eab308','#f8fafc'].map(c=>`<button type="button" class="kfsSwatch" data-c="${c}" style="background:${c}"></button>`).join('')}</div></section><section class="kfsSection"><div class="kfsTitle">Animated profile</div><label class="kfsField"><b>Animated wallpaper URL</b><small>GIF, MP4 or WebM can animate behind your profile.</small><input id="kfsAnimatedUrl" class="kfsInput" value="${H(safe?.animated_wallpaper_url||'')}" placeholder="https://..."></label><label class="kfsRow"><span><b>Wallpaper motion</b><small>Turn animated wallpaper on or off.</small></span><input id="kfsMotion" class="kfsSwitch" type="checkbox" ${safe?.wallpaper_motion_enabled!==false?'checked':''}></label><label class="kfsRow"><span><b>Autoplay video wallpaper</b></span><input id="kfsWallpaperAutoplay" class="kfsSwitch" type="checkbox" ${safe?.wallpaper_autoplay?'checked':''}></label><label class="kfsField"><b>Wallpaper fit</b><select id="kfsWallpaperFit" class="kfsSelect"><option value="cover">Fill screen</option><option value="contain">Fit whole wallpaper</option></select></label><label class="kfsField"><b>Wallpaper dimming</b><input id="kfsWallpaperDim" type="range" min="0" max="80" value="${Number(safe?.wallpaper_dim_percent||0)}" style="width:100%;accent-color:var(--accent)"></label><label class="kfsField"><b>Profile style</b><select id="kfsLayout" class="kfsSelect"><option value="classic">Classic</option><option value="animated">Animated</option><option value="minimal">Minimal</option><option value="retro">Retro / early-2000s</option></select></label></section><section class="kfsSection"><div class="kfsTitle">Account & privacy</div><label class="kfsRow"><span><b>Private account</b></span><input id="kfsPrivate" class="kfsSwitch" type="checkbox" ${p.is_private?'checked':''}></label><label class="kfsField"><b>Profile location</b><input id="kfsLocation" class="kfsInput" value="${H(p.location_text||'')}" placeholder="Optional"></label><label class="kfsRow"><span><b>Allow location on posts</b></span><input id="kfsPostLocation" class="kfsSwitch" type="checkbox" ${pref?.allow_post_location?'checked':''}></label><label class="kfsField"><b>Language</b><select id="kfsLocale" class="kfsSelect"><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option><option value="de">Deutsch</option><option value="pt">Português</option><option value="ja">日本語</option><option value="ko">한국어</option></select></label></section><section class="kfsSection"><div class="kfsTitle">Messages & notifications</div><label class="kfsField"><b>Who can message you</b><select id="kfsMessages" class="kfsSelect"><option value="friends">Friends</option><option value="everyone">Everyone</option><option value="nobody">No one</option></select></label><label class="kfsRow"><span><b>Disappearing messages by default</b></span><input id="kfsDisappear" class="kfsSwitch" type="checkbox" ${pref?.disappearing_messages_default?'checked':''}></label><label class="kfsRow"><span><b>Show online status</b></span><input id="kfsOnline" class="kfsSwitch" type="checkbox" ${us?.show_online!==false?'checked':''}></label><label class="kfsRow"><span><b>Push notifications</b></span><input id="kfsPush" class="kfsSwitch" type="checkbox" ${np?.push_enabled!==false?'checked':''}></label><label class="kfsRow"><span><b>Email notifications</b></span><input id="kfsEmail" class="kfsSwitch" type="checkbox" ${np?.email_enabled?'checked':''}></label></section><section class="kfsSection"><div class="kfsTitle">More controls</div><button type="button" class="kfsNav" onclick="closeKinfolkSettings();go('friends')"><span>Friends & following</span><strong>›</strong></button><button type="button" class="kfsNav" onclick="closeKinfolkSettings();go('messages')"><span>Messages & replies</span><strong>›</strong></button><button type="button" class="kfsNav" onclick="toast('Blocked accounts management is next','good')"><span>Blocked accounts</span><strong>›</strong></button></section><button id="kfsSave" class="kfsSave" type="submit">Save changes</button></form>`;document.body.appendChild(el);if(isTeen){const privacy=$('#kfsPrivate');if(privacy){privacy.checked=true;privacy.disabled=true;privacy.setAttribute('aria-describedby','kfsTeenPrivacyNote');const note=document.createElement('small');note.id='kfsTeenPrivacyNote';note.textContent='Teen accounts remain private until age 18.';privacy.closest('.kfsRow')?.after(note)}}$('#kfsGender').value=(ex?.gender||'').toLowerCase();$('#kfsOrientation').value=ex?.orientation||'';$('#kfsRelationship').value=ex?.relationship_status||'';$('#kfsLayout').value=p.profile_layout||'classic';$('#kfsWallpaperFit').value=safe?.wallpaper_fit||'cover';$('#kfsLocale').value=(pref?.locale||'en').toLowerCase();$('#kfsMessages').value=us?.allow_messages||'friends';const w=$('#kfsAccent'),t=$('#kfsAccentText'),preview=c=>{if(/^#[0-9a-fA-F]{6}$/.test(c)){w.value=c;t.value=c;theme(c)}};w.oninput=()=>preview(w.value);t.oninput=()=>preview(t.value);el.querySelectorAll('.kfsSwatch').forEach(b=>b.onclick=()=>preview(b.dataset.c));$('#kfsForm').onsubmit=async e=>{e.preventDefault();if(state.user?.id!==settingsAccountId){toast('Account changed. Reopen Settings before saving.','danger');return}if(isTeen)$('#kfsPrivate').checked=true;const btn=$('#kfsSave');btn.disabled=true;btn.textContent='Saving…';const c=t.value.trim();if(!/^#[0-9a-fA-F]{6}$/.test(c)){btn.disabled=false;btn.textContent='Save changes';return toast('Choose a valid color','danger')}const [a,b,c1,d,e1,f]=await Promise.all([sb.from('profiles').update({is_private:$('#kfsPrivate').checked,location_text:$('#kfsLocation').value.trim()||null,profile_layout:$('#kfsLayout').value,profile_animated:$('#kfsLayout').value==='animated'||$('#kfsMotion').checked,accent_color:c}).eq('id',settingsAccountId).select().single(),sb.from('kinfolk_profile_extras').upsert({user_id:settingsAccountId,gender:$('#kfsGender').value||null,orientation:$('#kfsOrientation').value||null,relationship_status:$('#kfsRelationship').value||null},{onConflict:'user_id'}),sb.from('kinfolk_safety_settings').upsert({user_id:settingsAccountId,animated_wallpaper_url:$('#kfsAnimatedUrl').value.trim()||null,wallpaper_motion_enabled:$('#kfsMotion').checked,wallpaper_autoplay:$('#kfsWallpaperAutoplay').checked,wallpaper_fit:$('#kfsWallpaperFit').value,wallpaper_dim_percent:Number($('#kfsWallpaperDim').value||0)},{onConflict:'user_id'}),sb.from('user_settings').upsert({user_id:settingsAccountId,show_online:$('#kfsOnline').checked,allow_messages:$('#kfsMessages').value},{onConflict:'user_id'}),sb.from('kinfolk_user_preferences').upsert({user_id:settingsAccountId,locale:$('#kfsLocale').value,allow_post_location:$('#kfsPostLocation').checked,disappearing_messages_default:$('#kfsDisappear').checked},{onConflict:'user_id'}),sb.from('notification_preferences').upsert({user_id:settingsAccountId,push_enabled:$('#kfsPush').checked,email_enabled:$('#kfsEmail').checked},{onConflict:'user_id'})]);if(state.user?.id!==settingsAccountId)return;const er=a.error||b.error||c1.error||d.error||e1.error||f.error;if(er){btn.disabled=false;btn.textContent='Save changes';return toast(er.message,'danger')}state.profile=a.data;state.profiles?.set?.(a.data.id,a.data);theme(c);closeKinfolkSettings();await renderApp();setTimeout(refreshWallpaper,80);toast('Profile and settings saved','good')}};
let cache='',wallpaperRequest=0;async function refreshWallpaper(){const request=++wallpaperRequest,accountId=state?.user?.id;if(!accountId){document.getElementById('kinfolkWallpaperLayer')?.remove();cache='';return}const p=state.profile||{};theme(p.accent_color||'#e85a9b');let s=null;try{s=await one('kinfolk_safety_settings')}catch{}if(request!==wallpaperRequest||state?.user?.id!==accountId)return;const url=s?.animated_wallpaper_url||p.wallpaper_url||'';const route=String(state.route||state.view||state.page||'').toLowerCase(),onProfile=route.includes('profile')||!!document.querySelector('.profileView,.profile-page,[aria-current="page"][data-view="profile"]');let layer=document.getElementById('kinfolkWallpaperLayer');if(!onProfile||!url||s?.wallpaper_motion_enabled===false){layer?.remove();cache='';return}const fit=s?.wallpaper_fit||'cover',dim=String(Number(s?.wallpaper_dim_percent||0)/100),autoplay=!!s?.wallpaper_autoplay,nextCache=JSON.stringify([accountId,url,fit,dim,autoplay]);if(layer&&cache===nextCache)return;layer?.remove();layer=document.createElement('div');layer.id='kinfolkWallpaperLayer';layer.style.setProperty('--kfw-fit',fit);layer.style.setProperty('--kfw-dim',dim);if(/\.(mp4|webm|mov)(\?|$)/i.test(url))layer.innerHTML=`<video ${autoplay?'autoplay':''} loop muted playsinline src="${H(url)}"></video><div class="kfwDim"></div>`;else layer.innerHTML=`<div class="kfwImage" style="background-image:url(&quot;${H(url)}&quot;)"></div><div class="kfwDim"></div>`;document.body.prepend(layer);cache=nextCache}new MutationObserver(()=>{clearTimeout(window._kfwTimer);window._kfwTimer=setTimeout(refreshWallpaper,150)}).observe(document.documentElement,{subtree:true,childList:true});setTimeout(refreshWallpaper,650);
})();
;

;
(function(){
const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const one=async t=>{const r=await sb.from(t).select('*').eq('user_id',state.user.id).maybeSingle();return r.error?null:r.data};
const css=document.createElement('style');css.textContent=`.kfsSub{position:fixed;inset:0;z-index:10020;background:var(--bg,#0d0d12);color:var(--text,#fff);overflow:auto}.kfsSubTop{position:sticky;top:0;display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top)) 16px 10px;background:rgba(13,13,18,.96);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.08)}.kfsSubTop button{border:0;background:transparent;color:inherit;font-size:30px}.kfsSubBody{max-width:640px;margin:auto;padding:18px 18px 50px}.kfsPerson{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08)}.kfsAvatar{width:48px;height:48px;border-radius:50%;object-fit:cover;background:#2b2b33}.kfsPersonMain{min-width:0;flex:1}.kfsPersonMain b,.kfsPersonMain small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kfsGhostBtn,.kfsAction{border:1px solid color-mix(in srgb,var(--accent) 70%,#fff);border-radius:999px;padding:9px 14px;background:transparent;color:inherit;font-weight:800}.kfsAction{background:var(--accent);border-color:var(--accent);color:#fff}.kfsText{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.04);color:inherit;padding:12px;font:inherit}.kfsNote{color:var(--muted,#aaa);line-height:1.5}.kfsCheck{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.07)}.kfsCheck input{width:20px;height:20px;accent-color:var(--accent)}.kfsLegal h3{margin-top:24px}.kfsLegal p,.kfsLegal li{line-height:1.55;color:#ddd}.kfsDanger{color:#ff8f9d}`;document.head.appendChild(css);
function sub(title,body){document.getElementById('kfsSubScreen')?.remove();const el=document.createElement('div');el.id='kfsSubScreen';el.className='kfsSub';el.innerHTML=`<div class="kfsSubTop"><button type="button" onclick="closeKfsSub()">‹</button><h2 style="margin:0;font-size:21px">${H(title)}</h2></div><div class="kfsSubBody">${body}</div>`;document.body.appendChild(el);return el}window.closeKfsSub=()=>document.getElementById('kfsSubScreen')?.remove();
window.openBlockedAccounts=async function(){sub('Blocked accounts','<p class="kfsNote">People you block are removed from discovery and suggestions. You can unblock them here.</p><div id="kfsBlockedList">Loading…</div>');const {data:rows,error}=await sb.from('blocks').select('blocked_id').eq('blocker_id',state.user.id);if(error)return $('#kfsBlockedList').textContent=error.message;const ids=(rows||[]).map(x=>x.blocked_id);if(!ids.length)return $('#kfsBlockedList').innerHTML='<p class="kfsNote">You have no blocked accounts.</p>';const {data:people}=await sb.from('profiles').select('id,username,display_name,avatar_url').in('id',ids);$('#kfsBlockedList').innerHTML=(people||[]).map(p=>`<div class="kfsPerson"><img class="kfsAvatar" src="${H(p.avatar_url||'')}" onerror="this.style.visibility='hidden'"><div class="kfsPersonMain"><b>${H(p.display_name||p.username)}</b><small>@${H(p.username||'')}</small></div><button class="kfsGhostBtn" onclick="unblockKinfolk('${p.id}')">Unblock</button></div>`).join('')};
window.unblockKinfolk=async id=>{const {error}=await sb.from('blocks').delete().eq('blocker_id',state.user.id).eq('blocked_id',id);if(error)return toast(error.message,'danger');toast('Account unblocked','good');openBlockedAccounts()};
window.openAccountSecurity=function(){sub('Account security',`<p class="kfsNote">Change your password while signed in. Kinfolk currently accepts 12–128 characters.</p><form id="kfsPasswordForm"><label><b>New password</b><input id="kfsNewPassword" class="kfsText" type="password" minlength="12" maxlength="128" autocomplete="new-password"></label><label style="display:block;margin-top:14px"><b>Confirm password</b><input id="kfsConfirmPassword" class="kfsText" type="password" minlength="12" maxlength="128" autocomplete="new-password"></label><button class="kfsAction" style="width:100%;margin-top:18px" type="submit">Update password</button></form>`);$('#kfsPasswordForm').onsubmit=async e=>{e.preventDefault();const a=$('#kfsNewPassword').value,b=$('#kfsConfirmPassword').value;if(a.length<12||a.length>128)return toast('Password must be 12–128 characters','danger');if(a!==b)return toast('Passwords do not match','danger');const {error}=await sb.auth.updateUser({password:a});if(error)return toast(error.message,'danger');toast('Password updated','good');closeKfsSub()}};
window.openNotificationDetails=async function(){const n=await one('notification_preferences')||{};sub('Notification settings',`<p class="kfsNote">Choose exactly which activity can reach your email.</p><form id="kfsNotifDetailForm"><label class="kfsCheck"><span>Friend requests</span><input id="ndFriend" type="checkbox" ${n.email_friend_requests!==false?'checked':''}></label><label class="kfsCheck"><span>Direct messages</span><input id="ndMessages" type="checkbox" ${n.email_messages?'checked':''}></label><label class="kfsCheck"><span>Group activity</span><input id="ndGroups" type="checkbox" ${n.email_group_activity?'checked':''}></label><label class="kfsCheck"><span>Post activity</span><input id="ndPosts" type="checkbox" ${n.email_post_activity?'checked':''}></label><label class="kfsCheck"><span>Kinfolk updates & marketing</span><input id="ndMarketing" type="checkbox" ${n.marketing_email?'checked':''}></label><button class="kfsAction" style="width:100%;margin-top:18px" type="submit">Save notifications</button></form>`);$('#kfsNotifDetailForm').onsubmit=async e=>{e.preventDefault();const {error}=await sb.from('notification_preferences').upsert({user_id:state.user.id,email_friend_requests:$('#ndFriend').checked,email_messages:$('#ndMessages').checked,email_group_activity:$('#ndGroups').checked,email_post_activity:$('#ndPosts').checked,marketing_email:$('#ndMarketing').checked},{onConflict:'user_id'});if(error)return toast(error.message,'danger');toast('Notification settings saved','good');closeKfsSub()}};
window.openKinfolkHelp=function(){sub('Help & support',`<p class="kfsNote">Tell us what went wrong. This sends a diagnostic report tied to your account so the issue can be investigated.</p><form id="kfsProblemForm"><textarea id="kfsProblemText" class="kfsText" rows="7" maxlength="500" placeholder="Describe the problem…"></textarea><button class="kfsAction" style="width:100%;margin-top:14px" type="submit">Report a problem</button></form>`);$('#kfsProblemForm').onsubmit=async e=>{e.preventDefault();const msg=$('#kfsProblemText').value.trim();if(msg.length<5)return toast('Please add a little more detail','danger');const platform=/android/i.test(navigator.userAgent)?'android':/iphone|ipad/i.test(navigator.userAgent)?'ios':'web';const {error}=await sb.from('client_diagnostics').insert({user_id:state.user.id,app_version:'phase39',platform,area:'user_report',code:'USER_REPORT',message:msg,context:{path:location.pathname,user_agent:navigator.userAgent.slice(0,300)}});if(error)return toast(error.message,'danger');toast('Problem report sent','good');closeKfsSub()}};
window.openKinfolkGuidelines=function(){sub('Community Guidelines',`<div class="kfsLegal"><p>Kinfolk is for real people, creative profiles, conversation and community. These preview guidelines are being wired into the app before launch.</p><h3>Be respectful</h3><p>No harassment, threats, hateful conduct, impersonation or targeted abuse.</p><h3>Keep people safe</h3><p>No sexual exploitation, non-consensual intimate content, dangerous challenges, or attempts to sexualize minors.</p><h3>Post what you have the right to share</h3><p>Do not post private information or copyrighted material you do not have permission to use.</p><h3>Use reporting and blocking</h3><p>Kinfolk includes reporting and blocking tools to help users control their experience.</p></div>`)};
window.openKinfolkTerms=function(){sub('Terms & privacy',`<div class="kfsLegal"><p><b>Pre-launch draft.</b> This screen is not the final legal text.</p><p>Kinfolk will explain account rules, acceptable use, content ownership, privacy choices, moderation, deletion, and applicable service terms before launch.</p><p class="kfsDanger">Final Terms of Service and Privacy Policy still require a launch-ready legal review before production release.</p></div>`)};
const oldOpen=window.openKinfolkSettings;window.openKinfolkSettings=async function(){await oldOpen();const sections=[...document.querySelectorAll('#kinfolkSettingsScreen .kfsSection')];const more=sections.find(x=>x.textContent.includes('More controls'));if(!more)return;const blocked=[...more.querySelectorAll('button')].find(b=>b.textContent.includes('Blocked accounts'));if(blocked)blocked.onclick=openBlockedAccounts;const mk=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='kfsNav';b.innerHTML=`<span>${H(label)}</span><strong>›</strong>`;b.onclick=fn;more.appendChild(b)};mk('Account security',openAccountSecurity);mk('Notification settings',openNotificationDetails);mk('Help & support',openKinfolkHelp);mk('Community Guidelines',openKinfolkGuidelines);mk('Terms & privacy',openKinfolkTerms)};
})();
;

;
(function(){
const css=document.createElement('style');css.textContent=`.kfwUpload{margin-top:12px;padding:14px;border:1px dashed color-mix(in srgb,var(--accent) 52%,rgba(255,255,255,.18));border-radius:16px;background:color-mix(in srgb,var(--accent) 7%,transparent)}.kfwUploadBtn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:11px 16px;background:var(--accent,#e85a9b);color:#fff;font-weight:900}.kfwUploadMeta{margin-top:8px;color:var(--muted,#999);font-size:13px;line-height:1.4}.kfwProgress{height:5px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:10px;display:none}.kfwProgress>i{display:block;height:100%;width:0;background:var(--accent,#e85a9b);transition:width .2s}`;document.head.appendChild(css);
const validTypes=new Set(['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']);
const extFor=f=>{const byType={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','video/mp4':'mp4','video/webm':'webm'};return byType[f.type]||String(f.name||'').split('.').pop().toLowerCase()||'bin'};
window.uploadKinfolkWallpaper=async function(input){const file=input?.files?.[0];if(!file||!state?.user)return;if(!validTypes.has(file.type))return toast('Use JPG, PNG, WebP, GIF, MP4 or WebM','danger');if(file.size>15*1024*1024)return toast('Wallpaper must be 15 MB or smaller','danger');const box=input.closest('.kfwUpload'),meta=box?.querySelector('.kfwUploadMeta'),bar=box?.querySelector('.kfwProgress'),fill=bar?.querySelector('i'),btn=box?.querySelector('.kfwUploadBtn');if(btn)btn.textContent='Uploading…';if(bar)bar.style.display='block';if(fill)fill.style.width='35%';if(meta)meta.textContent='Uploading securely to your Kinfolk wallpaper folder…';const ext=extFor(file),path=`${state.user.id}/profile-wallpaper-${Date.now()}.${ext}`;const {error:upErr}=await sb.storage.from('kinfolk-wallpapers').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});if(upErr){if(btn)btn.textContent='Choose from phone';if(fill)fill.style.width='0';if(meta)meta.textContent=upErr.message;return toast(upErr.message,'danger')}if(fill)fill.style.width='70%';const {data:signed,error:signErr}=await sb.storage.from('kinfolk-wallpapers').createSignedUrl(path,31536000);if(signErr){if(btn)btn.textContent='Choose from phone';if(meta)meta.textContent=signErr.message;return toast(signErr.message,'danger')}const signedUrl=signed?.signedUrl||'';const {error:saveErr}=await sb.from('kinfolk_safety_settings').upsert({user_id:state.user.id,animated_wallpaper_url:signedUrl,wallpaper_motion_enabled:true},{onConflict:'user_id'});if(saveErr){if(btn)btn.textContent='Choose from phone';if(meta)meta.textContent=saveErr.message;return toast(saveErr.message,'danger')}const urlBox=document.getElementById('kfsAnimatedUrl');if(urlBox)urlBox.value=signedUrl;const motion=document.getElementById('kfsMotion');if(motion)motion.checked=true;if(fill)fill.style.width='100%';if(btn)btn.textContent='Change wallpaper';if(meta)meta.textContent=`Saved ${file.name}. Your animated profile wallpaper is ready.`;toast('Wallpaper uploaded','good')};
const oldOpen=window.openKinfolkSettings;window.openKinfolkSettings=async function(){await oldOpen();const animated=[...document.querySelectorAll('#kinfolkSettingsScreen .kfsSection')].find(x=>x.textContent.includes('Animated profile'));if(!animated||animated.querySelector('.kfwUpload'))return;const urlField=animated.querySelector('#kfsAnimatedUrl')?.closest('.kfsField');if(!urlField)return;const wrap=document.createElement('div');wrap.className='kfwUpload';wrap.innerHTML=`<input id="kfwFileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" hidden onchange="uploadKinfolkWallpaper(this)"><button type="button" class="kfwUploadBtn" onclick="document.getElementById('kfwFileInput').click()">📱 Choose from phone</button><div class="kfwUploadMeta">Upload a photo, GIF, MP4 or WebM. Maximum 15 MB. Animated files can play behind your profile.</div><div class="kfwProgress"><i></i></div>`;urlField.after(wrap)};
})();
;

;
(function(){const PREF='kinfolk_stay_logged_in',TAB='kinfolk_session_tab';function wantStay(){const v=localStorage.getItem(PREF);return v===null?true:v==='1'}function injectStay(){const form=document.getElementById('authForm');if(!form||form.dataset.stayReady)return;form.dataset.stayReady='1';const btn=document.getElementById('authBtn');if(!btn)return;const row=document.createElement('label');row.style.cssText='display:flex;align-items:center;gap:10px;margin:10px 0 14px;color:var(--muted,#aaa);font-size:14px;cursor:pointer';row.innerHTML='<input id="kinfolkStayLoggedIn" type="checkbox" style="width:20px;height:20px;accent-color:var(--accent,#e85a9b)"><span><b style="color:var(--text,#fff)">Stay logged in</b><br><small>Keep this account signed in on this device.</small></span>';btn.before(row);const cb=document.getElementById('kinfolkStayLoggedIn');cb.checked=wantStay();form.addEventListener('submit',()=>{localStorage.setItem(PREF,cb.checked?'1':'0');if(cb.checked)sessionStorage.removeItem(TAB);else sessionStorage.setItem(TAB,'1')},true)}const oldRender=window.renderAuth;if(typeof oldRender==='function')window.renderAuth=function(mode){const r=oldRender(mode);setTimeout(injectStay,0);return r};setTimeout(injectStay,0);const originalSignUp=sb.auth.signUp.bind(sb.auth);sb.auth.signUp=async function(credentials){const c={...credentials,options:{...(credentials?.options||{})}};/* Preserve verified HTTPS callbacks, but never send native/local origins to Supabase email. */const redirect=c.options.emailRedirectTo;const native=(typeof window!=='undefined'&&window.KINFOLK_NATIVE_ALPHA===true)||(typeof window!=='undefined'&&typeof window.Capacitor?.isNativePlatform==='function'&&window.Capacitor.isNativePlatform())||(typeof location!=='undefined'&&/^(?:capacitor|ionic):$/.test(location.protocol||''));if(native){/* Every native signup path, including legacy forms, must use the packaged app-link callback. Never fall back to Supabase's Site URL. */let u;try{u=new URL(String(typeof window!=='undefined'?window.KINFOLK_EMAIL_REDIRECT_URL||'':''))}catch{}const host=u?.hostname?.toLowerCase().replace(/\.$/,'')||'';if(!u||u.protocol!=='https:'||u.username||u.password||u.hash||u.port||!host||host==='localhost'||host.endsWith('.localhost')||host==='vercel.app'||host.endsWith('.vercel.app')||host==='supabase.co'||host.endsWith('.supabase.co')||/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)||host.startsWith('['))return{data:{user:null,session:null},error:new Error('Native Kinfolk signup requires an approved HTTPS email verification callback.')};c.options.emailRedirectTo=u.href}else if(redirect!==undefined){try{const u=new URL(String(redirect));if(u.protocol!=='https:'||['localhost','127.0.0.1','0.0.0.0'].includes(u.hostname)||u.hostname.endsWith('.localhost'))delete c.options.emailRedirectTo}catch{delete c.options.emailRedirectTo}}const pw=String(c.password||'');if(pw.length<12||pw.length>128)return{data:{user:null,session:null},error:new Error('Password must be 12–128 characters.')};return originalSignUp(c)};const originalSignIn=sb.auth.signInWithPassword.bind(sb.auth);sb.auth.signInWithPassword=async function(credentials){/* Existing-account passwords must be accepted by the authentication provider. The 12-128 limit is signup-only. */return originalSignIn(credentials)};sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')sessionStorage.removeItem(TAB)}); /* Recovery129: initial session check is centralized in boot(). */})();
;

;
(function(){const pc=document.createElement('style');pc.textContent=`.kpComposer .textarea{min-height:120px}.kpMediaPick{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.kpPreview{margin-top:10px;border-radius:16px;overflow:hidden;background:#09090d;display:none}.kpPreview img{display:block;width:100%;max-height:56vh;object-fit:contain}.kpMeta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.kpMeta .field{margin:0}.kpFileHint{font-size:12px;color:var(--muted,#999);margin-top:7px}.kpRemove{border:0;background:rgba(255,255,255,.08);color:inherit;border-radius:999px;padding:8px 12px}.kpProgress{height:5px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin:10px 0;display:none}.kpProgress i{display:block;height:100%;width:0;background:var(--accent,#e85a9b);transition:width .2s}`;document.head.appendChild(pc);const IMG_TYPES=new Set(['image/jpeg','image/png','image/webp','image/gif']);window.openPostModal=function(photo=false){modal('Create post',`<form id="postForm" class="kpComposer"><textarea class="textarea" id="postBody" maxlength="5000" placeholder="What’s happening?"></textarea><div class="label">Photo</div><div class="kpMediaPick"><input class="field" id="postFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><button class="kpRemove" id="postRemove" type="button" style="display:none">Remove</button></div><div class="kpFileHint">JPG, PNG, WebP or GIF · up to 5 MB</div><div id="postPreview" class="kpPreview"></div><div class="kpMeta"><select class="field" id="postRating"><option value="general">General</option><option value="mature">Mature</option></select><input class="field" id="postLocation" maxlength="80" placeholder="Location (optional)"></div><div id="postProgressBar" class="kpProgress"><i></i></div><div id="postProgress" class="muted" style="margin:8px 0"></div><button id="postSubmit" class="btn primary full">Post</button></form>`);const input=$('#postFile'),preview=$('#postPreview'),remove=$('#postRemove');const reset=()=>{input.value='';preview.innerHTML='';preview.style.display='none';remove.style.display='none'};remove.onclick=reset;input.onchange=()=>{const f=input.files?.[0];if(!f)return reset();if(!IMG_TYPES.has(f.type)){toast('Use JPG, PNG, WebP or GIF','danger');return reset()}if(f.size>5*1024*1024){toast('Photo must be 5 MB or smaller','danger');return reset()}const u=URL.createObjectURL(f);preview.innerHTML=`<img alt="Selected post photo" src="${u}">`;preview.style.display='block';remove.style.display='inline-block'};$('#postForm').onsubmit=window.createPost;if(photo)setTimeout(()=>input.click(),60)};window.createPost=async function(e){e.preventDefault();const body=$('#postBody').value.trim(),file=$('#postFile').files?.[0],location=$('#postLocation').value.trim(),rating=$('#postRating').value;if(!body&&!file)return toast('Add text or a photo','danger');if(file&&(!IMG_TYPES.has(file.type)||file.size>5*1024*1024))return toast('Choose a supported photo up to 5 MB','danger');const btn=$('#postSubmit'),msg=$('#postProgress'),bar=$('#postProgressBar'),fill=bar.querySelector('i');btn.disabled=true;btn.textContent='Posting…';bar.style.display='block';fill.style.width='12%';let path=null;try{if(file){msg.textContent='Uploading photo…';path=`${state.user.id}/posts/${crypto.randomUUID()}-${safeName(file.name)}`;const{error}=await sb.storage.from('kinfolk-media').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});if(error)throw error;fill.style.width='68%'}msg.textContent='Publishing post…';const{error}=await sb.from('posts').insert({author_id:state.user.id,body:body||'',media_url:path,content_rating:rating,location_label:location||null});if(error)throw error;fill.style.width='100%';closeModal();await loadFeed();await renderApp();toast('Posted to Kinfolk','good')}catch(err){if(path){try{await sb.storage.from('kinfolk-media').remove([path])}catch{}}btn.disabled=false;btn.textContent='Post';fill.style.width='0';msg.textContent='';toast(err.message||'Post failed','danger')}}})();
;

;
(function(){const css=document.createElement('style');css.textContent=`.kvComposer .formRow{display:grid;grid-template-columns:1fr 1fr;gap:10px}.kvPreview{display:none;margin:12px 0;border-radius:16px;overflow:hidden;background:#09090d}.kvPreview video{display:block;width:100%;max-height:58vh;background:#000}.kvHint{font-size:12px;color:var(--muted,#999);margin-top:7px}.kvProgress{height:5px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin:10px 0;display:none}.kvProgress i{display:block;height:100%;width:0;background:var(--accent,#e85a9b);transition:width .2s}.kvFileRow{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.kvRemove{border:0;background:rgba(255,255,255,.08);color:inherit;border-radius:999px;padding:8px 12px}@media(max-width:520px){.kvComposer .formRow{grid-template-columns:1fr}}`;document.head.appendChild(css);const VIDEO_TYPES=new Set(['video/mp4','video/webm','video/quicktime']);const MAX=250*1024*1024;window.openVideoModal=function(){const opts=state.channels.filter(c=>c.owner_id===state.user.id).map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('');modal('Upload video',`<form id="videoForm" class="kvComposer"><div class="label">Title</div><input class="field" id="videoTitle" maxlength="120" required><div class="label">Description</div><textarea class="textarea" id="videoDescription" maxlength="3000" placeholder="Tell people about this video"></textarea><div class="formRow"><div><div class="label">Type</div><select class="field" id="videoKind"><option value="reel">Reel</option><option value="video">Video</option></select></div><div><div class="label">Channel</div><select class="field" id="videoChannel"><option value="">Personal profile</option>${opts}</select></div></div><div class="formRow"><div><div class="label">Visibility</div><select class="field" id="videoVisibility"><option value="public">Public</option><option value="friends">Friends</option><option value="private">Only me</option></select></div><div><div class="label">Content</div><select class="field" id="videoRating"><option value="general">General</option><option value="mature">Mature</option></select></div></div><div class="label">Video file</div><div class="kvFileRow"><input class="field" id="videoFile" type="file" accept="video/mp4,video/webm,video/quicktime" required><button class="kvRemove" id="videoRemove" type="button" style="display:none">Remove</button></div><div class="kvHint">MP4, WebM or MOV · up to 250 MB · no artificial 90-second cap</div><div id="videoPreview" class="kvPreview"></div><div id="videoMeta" class="kvHint"></div><div id="videoProgressBar" class="kvProgress"><i></i></div><div id="videoProgress" class="muted" style="margin:8px 0"></div><button id="videoSubmit" class="btn primary full">Upload video</button></form>`);const input=$('#videoFile'),preview=$('#videoPreview'),remove=$('#videoRemove'),meta=$('#videoMeta');let objectUrl=null;const reset=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;input.value='';preview.innerHTML='';preview.style.display='none';remove.style.display='none';meta.textContent=''};remove.onclick=reset;input.onchange=()=>{const f=input.files?.[0];if(!f)return reset();if(!VIDEO_TYPES.has(f.type)){toast('Use MP4, WebM or MOV','danger');return reset()}if(f.size>MAX){toast('Video must be 250 MB or smaller','danger');return reset()}objectUrl=URL.createObjectURL(f);preview.innerHTML=`<video id="videoPreviewEl" src="${objectUrl}" controls playsinline preload="metadata"></video>`;preview.style.display='block';remove.style.display='inline-block';const v=$('#videoPreviewEl');v.onloadedmetadata=()=>{const d=Number.isFinite(v.duration)?Math.round(v.duration):0;meta.textContent=`${(f.size/1024/1024).toFixed(1)} MB${d?` · ${Math.floor(d/60)}:${String(d%60).padStart(2,'0')}`:''}`}};$('#videoForm').onsubmit=window.uploadVideo;};window.uploadVideo=async function(e){e.preventDefault();const f=$('#videoFile').files?.[0],title=$('#videoTitle').value.trim(),description=$('#videoDescription').value.trim(),kind=$('#videoKind').value,channel_id=$('#videoChannel').value||null,visibility=$('#videoVisibility').value,rating=$('#videoRating').value;if(!title)return toast('Add a title','danger');if(!f)return toast('Choose a video','danger');if(!VIDEO_TYPES.has(f.type))return toast('Use MP4, WebM or MOV','danger');if(f.size>MAX)return toast('Video must be 250 MB or smaller','danger');const btn=$('#videoSubmit'),msg=$('#videoProgress'),bar=$('#videoProgressBar'),fill=bar.querySelector('i');btn.disabled=true;btn.textContent='Uploading…';bar.style.display='block';fill.style.width='10%';let path=null;try{let duration=null;const pv=$('#videoPreviewEl');if(pv&&Number.isFinite(pv.duration))duration=Math.round(pv.duration*100)/100;msg.textContent='Uploading video…';path=`${state.user.id}/videos/${crypto.randomUUID()}-${safeName(f.name)}`;const{error:up}=await sb.storage.from('kinfolk-video').upload(path,f,{contentType:f.type,upsert:false,cacheControl:'3600'});if(up)throw up;fill.style.width='72%';msg.textContent='Publishing video…';const{error}=await sb.from('kinfolk_videos').insert({creator_id:state.user.id,title,description,kind,source_type:'upload',storage_path:path,source_mime:f.type,source_size:f.size,duration_seconds:duration,channel_id,visibility,content_rating:rating,processing_status:'ready',transcode_status:'not_required'});if(error)throw error;fill.style.width='100%';closeModal();await loadVideos();await renderApp();toast(kind==='reel'?'Reel uploaded':'Video uploaded','good')}catch(err){if(path){try{await sb.storage.from('kinfolk-video').remove([path])}catch{}}btn.disabled=false;btn.textContent='Upload video';fill.style.width='0';msg.textContent='';toast(err.message||'Video upload failed','danger')}};})();
;

;
(function(){function isSub(id){return (state.subscriptions.get(id)||[]).some(s=>s.user_id===state.user.id)}window.renderChannels=async function(main){const mine=state.channels.filter(c=>c.owner_id===state.user.id),subs=state.channels.filter(c=>isSub(c.id)),subIds=subs.map(c=>c.id),subVideos=state.videos.filter(v=>v.channel_id&&subIds.includes(v.channel_id));main.innerHTML=`<div class="card"><div class="cardpad"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><div><div class="sectionTitle" style="margin:0">Creator Channels</div><div class="muted">Build a community around your videos.</div></div><div class="spacer"></div><button class="btn primary" onclick="openChannelModal()">＋ Create channel</button></div><div class="chips" style="margin-top:14px;overflow:auto"><button class="chip active" onclick="channelFilter('discover',this)">Discover</button><button class="chip" onclick="channelFilter('subscriptions',this)">Subscriptions</button><button class="chip" onclick="channelFilter('mine',this)">My Channels (${mine.length})</button></div></div></div><div id="channelBody"></div>`;window.__channelSets={mine,subs,subVideos};await renderChannelList($('#channelBody'),state.channels)};window.channelFilter=async function(kind,btn){const root=$('#channelBody');document.querySelectorAll('.chips .chip').forEach(x=>x.classList.remove('active'));btn?.classList.add('active');if(kind==='mine')return renderChannelList(root,window.__channelSets.mine);if(kind==='subscriptions'){root.innerHTML='<div id="subChannelList"></div><div class="card"><div class="cardpad"><div class="sectionTitle">Latest uploads</div><div id="subVideos" class="videoGrid"></div></div></div>';await renderChannelList($('#subChannelList'),window.__channelSets.subs);return renderVideoGrid($('#subVideos'),window.__channelSets.subVideos)}return renderChannelList(root,state.channels)};window.renderChannelList=async function(root,arr){if(!arr.length){root.innerHTML='<div class="card"><div class="empty">No channels here yet.</div></div>';return}let h='<div class="card">';for(const c of arr){const av=c.avatar_url?await signed('kinfolk-media',c.avatar_url):null,sub=isSub(c.id),own=c.owner_id===state.user.id;h+=`<div class="channelCard"><div>${av?`<img class="avatar" src="${esc(av)}">`:`<div class="avatar">${esc((c.title||'?')[0])}</div>`}</div><div class="clickable" onclick="openChannel('${c.id}')"><b>${esc(c.title)}</b><div class="muted">${own?'Your channel':sub?'Subscribed':'Discover'}${c.slug?' · @'+esc(c.slug):''}</div><div class="muted" style="font-size:12px">${esc(c.description||c.category||'Creator channel')}</div></div>${own?`<button class="btn small" onclick="openChannel('${c.id}')">Manage</button>`:`<button class="btn small ${sub?'ghost':'primary'}" onclick="toggleSubscribe('${c.id}')">${sub?'Subscribed':'Subscribe'}</button>`}</div>`}h+='</div>';root.innerHTML=h};window.openChannel=async function(id){state.channelViewId=id;const c=state.channels.find(x=>x.id===id);if(!c)return;state.view='channels';$('#app').innerHTML=layout();const main=$('#main'),banner=c.banner_url?await signed('kinfolk-media',c.banner_url):null,av=c.avatar_url?await signed('kinfolk-media',c.avatar_url):null,sub=isSub(id),own=c.owner_id===state.user.id,vids=state.videos.filter(v=>v.channel_id===id);main.innerHTML=`<div class="card"><div class="channelBanner">${banner?`<img src="${esc(banner)}">`:''}</div><div class="channelHero"><div class="channelAvatar">${av?`<img class="avatar lg" src="${esc(av)}">`:`<div class="avatar lg">${esc((c.title||'?')[0])}</div>`}</div><div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;width:100%"><div><h2 style="margin:8px 0 2px">${esc(c.title)}</h2><div class="muted">${c.slug?'@'+esc(c.slug)+' · ':''}${vids.length} video${vids.length===1?'':'s'}${own?' · Your channel':sub?' · Subscribed':''}</div></div><div class="spacer"></div>${own?`<button class="btn" onclick="openChannelModal('${c.id}')">Edit channel</button><button class="btn primary" onclick="openChannelUpload('${c.id}')">＋ Upload</button>`:`<button class="btn ${sub?'ghost':'primary'}" onclick="toggleSubscribe('${c.id}')">${sub?'Subscribed':'Subscribe'}</button>${sub?`<button class="btn" onclick="openSubscriptionPrefs('${c.id}')">🔔</button>`:''}`}</div><p>${esc(c.description||'')}</p></div><div class="profileTabs"><button id="channelVideosTab" class="active" onclick="showChannelVideos('${c.id}')">Videos</button><button onclick="showChannelAbout('${c.id}')">About</button></div></div><div id="channelPane" class="videoGrid"></div>`;await renderVideoGrid($('#channelPane'),vids)};window.openChannelUpload=function(cid){openVideoModal();setTimeout(()=>{const s=$('#videoChannel');if(s)s.value=cid},30)}})();
;

;
(function(){const c=document.createElement('style');c.textContent='.kmTabs{display:flex;gap:8px;overflow:auto;margin-bottom:12px}.kmConv{padding:12px 2px;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer}.kmTop{display:flex;gap:8px}.kmTime{margin-left:auto;font-size:11px;color:var(--muted,#999)}.kmSnip{font-size:12px;color:var(--muted,#999);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kmThread{max-height:56vh;overflow:auto}.kmLine{display:flex;margin:8px 0}.kmLine.mine{justify-content:flex-end}.kmBubble{max-width:78%;padding:9px 11px;border-radius:15px;background:rgba(255,255,255,.08)}.kmLine.mine .kmBubble{background:color-mix(in srgb,var(--accent,#e85a9b) 30%,rgba(255,255,255,.08))}.kmStamp{font-size:10px;color:var(--muted,#999);margin-top:4px}.kmComposer{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.kmNote{font-size:12px;color:var(--muted,#999);padding:8px 0}';document.head.appendChild(c);const fmt=t=>{if(!t)return'';const d=new Date(t),n=new Date;return d.toDateString()===n.toDateString()?d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):d.toLocaleDateString([],{month:'short',day:'numeric'})};window.openMessages=async function(){const{data,error}=await sb.from('messages').select('*').or(`sender_id.eq.${state.user.id},receiver_id.eq.${state.user.id}`).order('created_at',{ascending:false}).limit(120);if(error)return toast(error.message,'danger');const latest=new Map;for(const m of(data||[])){const id=m.sender_id===state.user.id?m.receiver_id:m.sender_id;if(!latest.has(id))latest.set(id,m)}await loadProfiles([...latest.keys()]);modal('Messages',`<div class="kmTabs"><button class="btn primary">Direct</button><button class="btn" onclick="openGroups()">Groups</button><button class="btn" onclick="openNewMessage()">＋ New</button></div>${latest.size?[...latest].map(([id,m])=>{const p=state.profiles.get(id);return `<div class="kmConv" onclick="openDm('${id}')"><div class="kmTop"><b>${esc(p?.display_name||p?.username||'User')}</b><span class="kmTime">${fmt(m.created_at)}</span></div><div class="kmSnip">${m.sender_id===state.user.id?'You: ':''}${esc(m.body||'')}</div></div>`}).join(''):'<div class="empty">No direct conversations yet.</div>'}`)};window.openNewMessage=async function(){const ids=state.friendRequests.filter(r=>r.status==='accepted').map(r=>r.sender_id===state.user.id?r.receiver_id:r.sender_id);await loadProfiles(ids);modal('New message',ids.length?ids.map(id=>{const p=state.profiles.get(id);return `<button class="sideitem" onclick="openDm('${id}')">✉ <b>${esc(p?.display_name||p?.username||'Friend')}</b><span class="muted">@${esc(p?.username||'')}</span></button>`}).join(''):'<div class="empty">Add a friend first to start a conversation.</div>')};window.openDm=async function(peer){await loadProfiles([peer]);const p=state.profiles.get(peer),{data,error}=await sb.from('messages').select('*').or(`and(sender_id.eq.${state.user.id},receiver_id.eq.${peer}),and(sender_id.eq.${peer},receiver_id.eq.${state.user.id})`).order('created_at',{ascending:true}).limit(150);if(error)return toast(error.message,'danger');const rows=(data||[]).filter(m=>!m.expires_at||new Date(m.expires_at)>new Date);modal(p?.display_name||p?.username||'Message',`<div id="dmList" class="kmThread">${rows.map(m=>`<div class="kmLine ${m.sender_id===state.user.id?'mine':''}"><div class="kmBubble">${esc(m.body)}<div class="kmStamp">${fmt(m.created_at)}</div></div></div>`).join('')||'<div class="empty">Start the conversation.</div>'}</div><div class="kmNote">Disappearing-after-read is temporarily disabled until secure read receipts are repaired.</div><form id="dmForm" data-peer="${esc(peer)}" class="kmComposer"><input class="field" name="body" maxlength="2000" autocomplete="off" placeholder="Message…" required><button class="btn primary">Send</button></form>`);const l=$('#dmList');if(l)l.scrollTop=l.scrollHeight;$('#dmForm').onsubmit=async e=>{e.preventDefault();const body=e.target.body.value.trim(),b=e.target.querySelector('button');if(!body)return;b.disabled=true;b.textContent='Sending…';const{error}=await sb.from('messages').insert({sender_id:state.user.id,receiver_id:peer,body,disappear_after_read:false});if(error){b.disabled=false;b.textContent='Send';return toast(error.message,'danger')}await openDm(peer)}};window.openGroups=async function(){const{data,error}=await sb.from('group_conversations').select('*').order('created_at',{ascending:false});if(error)return toast(error.message,'danger');modal('Group chats',`<div class="kmTabs"><button class="btn" onclick="openMessages()">Direct</button><button class="btn primary">Groups</button><button class="btn" onclick="openGroupCreate()">＋ New</button></div>${(data||[]).map(g=>`<div class="kmConv" onclick="openGroup('${g.id}')"><div class="kmTop"><b>${esc(g.title)}</b><span class="kmTime">${fmt(g.created_at)}</span></div><div class="kmSnip">${g.owner_id===state.user.id?'You own this group':'Group conversation'}</div></div>`).join('')||'<div class="empty">No group chats yet.</div>'}`)};window.openGroup=async function(id){const[{data:g,error:e1},{data:msgs,error:e2}]=await Promise.all([sb.from('group_conversations').select('*').eq('id',id).single(),sb.from('group_messages').select('*').eq('conversation_id',id).order('created_at',{ascending:true}).limit(200)]);if(e1||e2)return toast((e1||e2).message,'danger');await loadProfiles((msgs||[]).map(m=>m.sender_id));modal(g.title,`<div id="groupMsgList" class="kmThread">${(msgs||[]).map(m=>{const p=state.profiles.get(m.sender_id),mine=m.sender_id===state.user.id;return `<div class="kmLine ${mine?'mine':''}"><div class="kmBubble"><div style="font-size:10px;opacity:.7">${mine?'You':esc(p?.display_name||p?.username||'User')}</div>${esc(m.body)}<div class="kmStamp">${fmt(m.created_at)}</div></div></div>`}).join('')||'<div class="empty">No messages yet.</div>'}</div><form id="groupMsgForm" class="kmComposer"><input class="field" name="body" maxlength="2000" autocomplete="off" placeholder="Message group…" required><button class="btn primary">Send</button></form>`);const l=$('#groupMsgList');if(l)l.scrollTop=l.scrollHeight;$('#groupMsgForm').onsubmit=async e=>{e.preventDefault();const body=e.target.body.value.trim(),b=e.target.querySelector('button');if(!body)return;b.disabled=true;b.textContent='Sending…';const{error}=await sb.from('group_messages').insert({conversation_id:id,sender_id:state.user.id,body});if(error){b.disabled=false;b.textContent='Send';return toast(error.message,'danger')}await openGroup(id)}};})();
;

;
(function(){const css=document.createElement('style');css.textContent=`.kpTabs{display:flex;gap:8px;overflow:auto;margin:12px 0}.kpPerson{display:grid;grid-template-columns:44px 1fr auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.07)}.kpPerson:last-child{border-bottom:0}.kpActions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.kpNotif{padding:12px 4px;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer}.kpNotif.unread{background:color-mix(in srgb,var(--accent,#e85a9b) 9%,transparent)}.kpNotif:last-child{border-bottom:0}.kpMeta{font-size:11px;color:var(--muted,#999);margin-top:4px}.kpSearch{position:sticky;top:0;z-index:2;background:var(--panel,#1b1b23);padding-bottom:8px}`;document.head.appendChild(css);function relationFor(id){return state.friendRequests.find(r=>(r.sender_id===state.user.id&&r.receiver_id===id)||(r.receiver_id===state.user.id&&r.sender_id===id))}function friendIds(){return state.friendRequests.filter(r=>r.status==='accepted').map(r=>r.sender_id===state.user.id?r.receiver_id:r.sender_id)}async function personRow(p){const av=await avatarHtml(p,'sm'),r=relationFor(p.id);let action='';if(r?.status==='accepted')action='<span class="muted">Friends</span>';else if(r?.status==='pending'&&r.sender_id===state.user.id)action='<span class="muted">Requested</span>';else if(r?.status==='pending'&&r.receiver_id===state.user.id)action=`<div class="kpActions"><button class="btn small primary" onclick="acceptFriend('${r.id}')">Accept</button><button class="btn small" onclick="declineFriend('${r.id}')">Decline</button></div>`;else if(r?.status==='declined')action='<span class="muted">Declined</span>';else action=`<button class="btn small" onclick="sendFriend('${p.id}')">Add friend</button>`;return `<div class="kpPerson">${av}<div class="clickable" onclick="openProfile('${p.id}')"><b>${esc(p.display_name||p.username||'User')}</b><div class="muted">@${esc(p.username||'')}</div>${p.location_text?`<div class="muted" style="font-size:11px">${esc(p.location_text)}</div>`:''}</div>${action}</div>`}window.renderPeople=async function(main){const{data:people,error}=await sb.from('profiles').select('*').neq('id',state.user.id).limit(100);if(error){main.innerHTML='<div class="card"><div class="empty">People could not load.</div></div>';return}(people||[]).forEach(p=>state.profiles.set(p.id,p));const incoming=state.friendRequests.filter(r=>r.status==='pending'&&r.receiver_id===state.user.id),friends=new Set(friendIds());window.__kpPeople=people||[];window.__kpMode='discover';main.innerHTML=`<div class="card"><div class="cardpad"><div class="sectionTitle">People & Friends</div><div class="kpSearch"><input class="field" id="peopleSearch" placeholder="Search name or username…"></div><div class="kpTabs"><button class="chip active" data-kp="discover" onclick="peopleMode('discover',this)">Discover</button><button class="chip" data-kp="friends" onclick="peopleMode('friends',this)">Friends (${friends.size})</button><button class="chip" data-kp="requests" onclick="peopleMode('requests',this)">Requests (${incoming.length})</button></div><div id="peopleList"></div></div></div>`;$('#peopleSearch').oninput=()=>renderPeopleMode();await renderPeopleMode()};window.peopleMode=async function(mode,btn){window.__kpMode=mode;document.querySelectorAll('[data-kp]').forEach(x=>x.classList.remove('active'));btn?.classList.add('active');await renderPeopleMode()};window.renderPeopleMode=async function(){const root=$('#peopleList');if(!root)return;const q=($('#peopleSearch')?.value||'').trim().toLowerCase(),all=window.__kpPeople||[];let arr=[];if(window.__kpMode==='friends'){const ids=new Set(friendIds());arr=all.filter(p=>ids.has(p.id))}else if(window.__kpMode==='requests'){const ids=new Set(state.friendRequests.filter(r=>r.status==='pending'&&r.receiver_id===state.user.id).map(r=>r.sender_id));arr=all.filter(p=>ids.has(p.id))}else arr=all.filter(p=>{const r=relationFor(p.id);return !r||r.status!=='accepted'});if(q)arr=arr.filter(p=>`${p.display_name||''} ${p.username||''}`.toLowerCase().includes(q));let h='';for(const p of arr)h+=await personRow(p);root.innerHTML=h||'<div class="empty">No people found.</div>'};window.acceptFriend=async function(id){const{error}=await sb.from('friend_requests').update({status:'accepted'}).eq('id',id);if(error)return toast(error.message,'danger');await loadFriendRequests();toast('Friend added','good');await renderPeopleMode()};window.declineFriend=async function(id){const{error}=await sb.from('friend_requests').update({status:'declined'}).eq('id',id);if(error)return toast(error.message,'danger');await loadFriendRequests();toast('Request declined');await renderPeopleMode()};window.sendFriend=async function(id){const existing=relationFor(id);if(existing)return toast(existing.status==='accepted'?'You are already friends.':existing.status==='pending'?'A friend request already exists.':'This request was previously declined.');const{error}=await sb.from('friend_requests').insert({sender_id:state.user.id,receiver_id:id,status:'pending'});if(error)return toast(error.message,'danger');await loadFriendRequests();toast('Friend request sent','good');await renderPeopleMode()};function notifText(n){const map={friend_request:'Friend request',friend_accepted:'Friend request accepted',post_like:'Liked your post',post_comment:'Commented on your post',comment_reply:'Replied to your comment',video_like:'Liked your video',video_comment:'Commented on your video',message:'New message',channel_subscription:'New channel subscriber'};return map[n.kind]||String(n.kind||'Notification').replaceAll('_',' ')}window.renderNotifications=async function(main){main.innerHTML=`<div class="card"><div class="cardpad"><div style="display:flex;align-items:center;gap:10px"><div class="sectionTitle" style="margin:0">Notifications</div><div class="spacer"></div><button class="btn small" onclick="markAllRead()">Mark all read</button></div><div id="notifs"></div></div></div>`;const root=$('#notifs');if(!state.notifications.length){root.innerHTML='<div class="empty">Nothing new yet.</div>';return}let h='';for(const n of state.notifications){const p=state.profiles.get(n.actor_id),name=p?.display_name||p?.username||'',msg=n.data?.message||notifText(n);h+=`<div class="kpNotif ${n.read_at?'':'unread'}" onclick="openNotification('${n.id}','${n.actor_id||''}')"><b>${esc(notifText(n))}</b><div>${name?`<span>${esc(name)}</span> · `:''}${esc(msg)}</div><div class="kpMeta">${fmt(n.created_at)}${n.read_at?'':' · New'}</div></div>`}root.innerHTML=h};window.openNotification=async function(id,actor){const n=state.notifications.find(x=>x.id===id);if(n&&!n.read_at){const{error}=await sb.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id);if(!error)n.read_at=new Date().toISOString()}if(actor)await openProfile(actor);else await renderApp()};window.markAllRead=async function(){const ids=state.notifications.filter(n=>!n.read_at).map(n=>n.id);if(!ids.length)return toast('You are all caught up.');const{error}=await sb.from('notifications').update({read_at:new Date().toISOString()}).in('id',ids);if(error)return toast(error.message,'danger');await loadNotifications();await renderApp();toast('Notifications marked read','good')};})();
;

;
(function(){const style=document.createElement('style');style.textContent=`#kinfolkNetBanner{position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:99999;padding:7px 12px;border-radius:999px;background:#2b2530;color:#fff;font-size:12px;box-shadow:0 8px 30px rgba(0,0,0,.3);display:none}#kinfolkNetBanner.show{display:block}`;document.head.appendChild(style);const banner=document.createElement('div');banner.id='kinfolkNetBanner';document.body.appendChild(banner);function net(){const off=!navigator.onLine;banner.textContent=off?'You’re offline. Kinfolk will reconnect when your connection returns.':'Back online';banner.classList.add('show');if(!off)setTimeout(()=>banner.classList.remove('show'),1800)}window.addEventListener('offline',net);window.addEventListener('online',net);if(!navigator.onLine)net();let popping=false,closingFromBack=false;function cleanUrl(hash){return location.pathname+location.search+(hash?'#'+hash:'')}function safeState(){return {kinfolk:true,view:(window.state&&state.view)||'home',profile:(window.state&&state.profileViewId)||null}}try{history.replaceState(safeState(),'',cleanUrl((window.state&&state.view)||'home'))}catch(_){}const oldSet=window.setView;if(typeof oldSet==='function')window.setView=async function(v){if(!popping){try{history.pushState({kinfolk:true,view:v,profile:null},'',cleanUrl(v))}catch(_){}}return oldSet(v)};const oldProfile=window.openProfile;if(typeof oldProfile==='function')window.openProfile=async function(id){if(!popping){try{history.pushState({kinfolk:true,view:'profile',profile:id},'',cleanUrl('profile'))}catch(_){}}return oldProfile(id)};const oldModal=window.modal;if(typeof oldModal==='function')window.modal=function(title,body){const out=oldModal(title,body);if(!popping){try{history.pushState({...safeState(),modal:true},'',location.href)}catch(_){}}return out};const oldClose=window.closeModal;if(typeof oldClose==='function')window.closeModal=function(){const had=!!document.querySelector('#modalRoot .modalBack');const out=oldClose();if(had&&history.state?.modal&&!closingFromBack){closingFromBack=true;history.back();setTimeout(()=>closingFromBack=false,50)}return out};window.addEventListener('popstate',async e=>{if(closingFromBack)return;const root=document.querySelector('#modalRoot');if(root?.querySelector('.modalBack')){popping=true;try{oldClose?.()}finally{popping=false}return}const s=e.state;if(!s?.kinfolk||!window.state)return;popping=true;try{state.view=s.view||'home';state.profileViewId=s.profile||null;await window.renderApp?.();window.scrollTo({top:0,behavior:'auto'})}catch(err){console.error('Kinfolk back navigation',err)}finally{popping=false}});const obs=new MutationObserver(()=>{document.querySelectorAll('.authCard .muted').forEach(x=>{if((x.textContent||'').trim()==='Phase 31 preview')x.textContent='Kinfolk preview'})});obs.observe(document.documentElement,{subtree:true,childList:true});})();
;

;
(function(){
const PENDING='kinfolk_pending_onboarding_v1';
function zodiac(date){
  if(!date)return '';
  const d=new Date(date+'T12:00:00'); if(Number.isNaN(d.getTime()))return '';
  const m=d.getMonth()+1,day=d.getDate();
  const signs=[[1,20,'Capricorn','Aquarius'],[2,19,'Aquarius','Pisces'],[3,21,'Pisces','Aries'],[4,20,'Aries','Taurus'],[5,21,'Taurus','Gemini'],[6,21,'Gemini','Cancer'],[7,23,'Cancer','Leo'],[8,23,'Leo','Virgo'],[9,23,'Virgo','Libra'],[10,23,'Libra','Scorpio'],[11,22,'Scorpio','Sagittarius'],[12,22,'Sagittarius','Capricorn']];
  const x=signs[m-1]; return day<x[1]?x[2]:x[3];
}
function injectOnboarding(){
  const form=document.getElementById('authForm');
  if(!form||!document.getElementById('displayName')||form.dataset.onboardingReady)return;
  form.dataset.onboardingReady='1';
  const msg=document.getElementById('authMsg'); if(!msg)return;
  const box=document.createElement('div');
  box.id='kinfolkSignupProfile'; box.style.cssText='margin-top:14px;padding-top:12px;border-top:1px solid var(--line,#333);display:grid;gap:10px';
  box.innerHTML=`
    <div style="font-weight:800">Build your profile</div>
    <div class="muted" style="font-size:12px">You can change these later in Edit Profile and Settings.</div>
    <div class="label">Birthday</div><input class="field" id="signupBirthday" type="date" required>
    <div class="muted" id="signupZodiac" style="font-size:12px">Horoscope will be calculated from your birthday.</div>
    <div class="formRow"><div><div class="label">Gender</div><select class="field" id="signupGender"><option value="">Prefer not to say</option><option>Male</option><option>Female</option><option>Non-binary</option></select></div><div><div class="label">Orientation</div><select class="field" id="signupOrientation"><option value="">Prefer not to say</option><option>Straight</option><option>Gay</option><option>Lesbian</option><option>Bisexual</option><option>Pansexual</option><option>Asexual</option><option>Queer</option><option>Questioning</option></select></div></div>
    <div class="formRow"><div><div class="label">Relationship</div><select class="field" id="signupRelationship"><option value="">Prefer not to say</option><option>Single</option><option>In a relationship</option><option>Engaged</option><option>Married</option><option>It's complicated</option><option>Separated</option><option>Divorced</option><option>Widowed</option></select></div><div><div class="label">Location</div><input class="field" id="signupLocation" maxlength="100" placeholder="Optional"></div></div>
    <div class="formRow"><div><div class="label">Theme color</div><input class="field" id="signupAccent" type="color" value="#e85a9b"></div><div><div class="label">Profile layout</div><select class="field" id="signupLayout"><option value="classic">Classic</option><option value="animated">Animated</option><option value="minimal">Minimal</option><option value="retro">Retro</option></select></div></div>`;
  msg.before(box);
  const bd=document.getElementById('signupBirthday');
  bd.max=new Date().toISOString().slice(0,10);
  bd.onchange=()=>{const z=zodiac(bd.value);document.getElementById('signupZodiac').textContent=z?`Horoscope: ${z}`:'Horoscope will be calculated from your birthday.'};
  form.addEventListener('submit',()=>{
    if(!document.getElementById('displayName'))return;
    const data={birthday:bd.value||null,gender:document.getElementById('signupGender').value||null,orientation:document.getElementById('signupOrientation').value||null,relationship_status:document.getElementById('signupRelationship').value||null,location_text:document.getElementById('signupLocation').value.trim()||null,accent_color:document.getElementById('signupAccent').value||'#e85a9b',profile_layout:document.getElementById('signupLayout').value||'classic'};
    localStorage.setItem(PENDING,JSON.stringify(data));
  },true);
}
const oldRender=window.renderAuth;
if(typeof oldRender==='function')window.renderAuth=function(mode){const r=oldRender(mode);setTimeout(injectOnboarding,0);return r};
setTimeout(injectOnboarding,0);
async function applyPending(session){
  const raw=localStorage.getItem(PENDING); if(!raw||!session?.user?.id)return;
  let p;try{p=JSON.parse(raw)}catch(_){localStorage.removeItem(PENDING);return}
  const uid=session.user.id,now=new Date().toISOString();
  const ex={user_id:uid,birthday:p.birthday||null,gender:p.gender||null,orientation:p.orientation||null,relationship_status:p.relationship_status||null,location_text:p.location_text||null,updated_at:now};
  const prof={accent_color:p.accent_color||'#e85a9b',profile_layout:p.profile_layout||'classic'};
  const safety={user_id:uid,birth_date:p.birthday||null};
  try{
    const results=await Promise.all([
      sb.from('kinfolk_profile_extras').upsert(ex,{onConflict:'user_id'}),
      sb.from('profiles').update(prof).eq('id',uid),
      sb.from('kinfolk_safety_settings').upsert(safety,{onConflict:'user_id'})
    ]);
    const err=results.find(x=>x?.error)?.error;
    if(err)throw err;
    localStorage.removeItem(PENDING);
    if(window.state?.user?.id===uid){try{await window.hydrateUser?.();window.state.profiles?.set(uid,window.state.profile);await window.renderApp?.()}catch(_){}}
    window.toast?.('Profile setup saved','good');
  }catch(e){console.warn('Kinfolk onboarding save',e)}
}
sb.auth.onAuthStateChange((event,session)=>{if(session?.user)setTimeout(()=>applyPending(session),0)});
sb.auth.getSession().then(({data})=>{if(data?.session)applyPending(data.session)}).catch(()=>{});
})();
;

;
(function(){
const PENDING='kinfolk_pending_onboarding_v1';
let syncing=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function signFor(date){if(!date)return'';const d=new Date(date+'T12:00:00');if(Number.isNaN(d.getTime()))return'';const m=d.getMonth()+1,x=d.getDate();const cut=[20,19,21,20,21,21,23,23,23,23,22,22],a=['Capricorn','Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius'],b=['Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn'];return x<cut[m-1]?a[m-1]:b[m-1]}
function swapSelect(id,values){const old=document.getElementById(id);if(!old||old.tagName==='SELECT')return;const s=document.createElement('select');s.className=old.className;s.id=id;const current=(old.value||'').trim();for(const [value,label] of values){const o=document.createElement('option');o.value=value;o.textContent=label;if(value.toLowerCase()===current.toLowerCase())o.selected=true;s.appendChild(o)}old.replaceWith(s)}
function polishEditProfile(){const form=document.getElementById('profileForm');if(!form||form.dataset.phase50)return;form.dataset.phase50='1';swapSelect('editGender',[['','Prefer not to say'],['Male','Male'],['Female','Female'],['Non-binary','Non-binary']]);swapSelect('editOrientation',[['','Prefer not to say'],['Straight','Straight'],['Gay','Gay'],['Lesbian','Lesbian'],['Bisexual','Bisexual'],['Pansexual','Pansexual'],['Asexual','Asexual'],['Queer','Queer'],['Questioning','Questioning']]);swapSelect('editRelationship',[['','Prefer not to say'],['Single','Single'],['In a relationship','In a relationship'],['Engaged','Engaged'],['Married','Married'],["It's complicated","It's complicated"],['Separated','Separated'],['Divorced','Divorced'],['Widowed','Widowed']]);const bd=document.getElementById('editBirthday');if(bd){let hint=document.getElementById('editHoroscopeHint');if(!hint){hint=document.createElement('div');hint.id='editHoroscopeHint';hint.className='muted';hint.style.cssText='font-size:12px;margin-top:5px';bd.after(hint)}const refresh=()=>{const s=signFor(bd.value);hint.textContent=s?`Horoscope: ${s}`:'Horoscope is calculated from your birthday.'};bd.max=new Date().toISOString().slice(0,10);bd.addEventListener('change',refresh);refresh()}}
const obs=new MutationObserver(polishEditProfile);obs.observe(document.documentElement,{subtree:true,childList:true});setTimeout(polishEditProfile,0);
async function robustOnboarding(session){if(syncing||!session?.user?.id)return;const raw=localStorage.getItem(PENDING);if(!raw)return;let data;try{data=JSON.parse(raw)}catch(_){return}syncing=true;const uid=session.user.id;try{let profile=null;for(let i=0;i<8;i++){const r=await sb.from('profiles').select('*').eq('id',uid).maybeSingle();if(r.data){profile=r.data;break}await sleep(300)}if(!profile)throw new Error('Profile record is still being prepared.');const now=new Date().toISOString();const ex={user_id:uid,birthday:data.birthday||null,gender:data.gender||null,orientation:data.orientation||null,relationship_status:data.relationship_status||null,location_text:data.location_text||null,updated_at:now};const prof={accent_color:data.accent_color||'#e85a9b',profile_layout:data.profile_layout||'classic'};const safety={user_id:uid,birth_date:data.birthday||null};const results=await Promise.all([sb.from('kinfolk_profile_extras').upsert(ex,{onConflict:'user_id'}),sb.from('profiles').update(prof).eq('id',uid),sb.from('kinfolk_safety_settings').upsert(safety,{onConflict:'user_id'})]);const failure=results.find(x=>x?.error)?.error;if(failure)throw failure;localStorage.removeItem(PENDING);const pr=await sb.from('profiles').select('*').eq('id',uid).maybeSingle();if(window.state){state.profile=pr.data||state.profile;if(pr.data)state.profiles?.set(uid,pr.data);state.view='home';state.profileViewId=null}if(pr.data&&window.applyKinfolkTheme)window.applyKinfolkTheme(pr.data.accent_color||'#e85a9b');try{if(typeof window.loadCore==='function')await window.loadCore()}catch(_){}try{if(typeof window.renderApp==='function')await window.renderApp()}catch(_){}window.scrollTo?.({top:0,behavior:'auto'});window.toast?.('Welcome to Kinfolk. Your profile is ready.','good')}catch(e){console.warn('Kinfolk first-profile sync',e)}finally{syncing=false}}
sb.auth.onAuthStateChange((event,session)=>{if(session?.user&&(event==='SIGNED_IN'||event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED'))setTimeout(()=>robustOnboarding(session),50)});sb.auth.getSession().then(({data})=>data?.session&&robustOnboarding(data.session)).catch(()=>{});
})();
;

;
(function(){
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');css.textContent=`
.kf51Profile{--kf51-accent:var(--accent,#e85a9b)}
.kf51Profile .profileCover{position:relative;overflow:hidden;min-height:170px;background:linear-gradient(135deg,color-mix(in srgb,var(--kf51-accent) 36%,#181820),#111118)}
.kf51Wallpaper{position:absolute;inset:0;z-index:0;overflow:hidden;background:#111}.kf51Wallpaper img,.kf51Wallpaper video{width:100%;height:100%;object-fit:cover;display:block}.kf51WallpaperShade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.06),rgba(0,0,0,.54))}.kf51Profile .profileHero{position:relative;z-index:2}.kf51Profile .profileCover>*:not(.kf51Wallpaper){position:relative;z-index:1}
.kf51Info{margin:10px 0 0;padding:0 2px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}.kf51Chip{flex:0 0 auto;padding:7px 10px;border-radius:999px;background:color-mix(in srgb,var(--kf51-accent) 13%,rgba(255,255,255,.07));border:1px solid color-mix(in srgb,var(--kf51-accent) 28%,rgba(255,255,255,.08));font-size:12px}.kf51Chip b{color:var(--kf51-accent)}
.kf51Music{margin:12px 0 0;padding:12px 14px;border-radius:16px;background:rgba(10,10,14,.78);border:1px solid color-mix(in srgb,var(--kf51-accent) 28%,rgba(255,255,255,.1));backdrop-filter:blur(14px)}.kf51MusicRow{display:flex;align-items:center;justify-content:space-between;gap:12px}.kf51Music a{color:var(--kf51-accent);font-weight:800;text-decoration:none}.kf51Music audio{width:100%;margin-top:9px;height:34px}
.kf51Badge{display:inline-flex;align-items:center;gap:6px;margin-top:7px;font-size:12px;color:var(--muted,#aaa)}.kf51Dot{width:8px;height:8px;border-radius:50%;background:var(--kf51-accent);box-shadow:0 0 14px var(--kf51-accent)}
.kf51Profile[data-layout='animated'] .profileCover{min-height:215px}.kf51Profile[data-layout='animated'] .profileHero{backdrop-filter:blur(10px);background:linear-gradient(to top,rgba(10,10,14,.82),rgba(10,10,14,.16));border-radius:18px 18px 0 0}.kf51Profile[data-layout='minimal'] .profileCover{min-height:115px}.kf51Profile[data-layout='minimal'] .profileHero{padding-top:8px}.kf51Profile[data-layout='retro'] .profileCover{border:2px solid var(--kf51-accent);box-shadow:inset 0 0 0 2px rgba(255,255,255,.08),0 0 22px color-mix(in srgb,var(--kf51-accent) 28%,transparent)}.kf51Profile[data-layout='retro'] .profileHero,.kf51Profile[data-layout='retro'] .profileTabs{border-left:2px solid var(--kf51-accent);border-right:2px solid var(--kf51-accent)}
@media (prefers-reduced-motion:reduce){.kf51Wallpaper video{display:none}.kf51Profile *{animation:none!important;transition:none!important}}
`;document.head.appendChild(css);
function signFor(date){if(!date)return'';const d=new Date(date+'T12:00:00');if(Number.isNaN(d.getTime()))return'';const m=d.getMonth()+1,x=d.getDate(),cut=[20,19,21,20,21,21,23,23,23,23,22,22],a=['Capricorn','Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius'],b=['Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn'];return x<cut[m-1]?a[m-1]:b[m-1]}
async function enhanceProfile(){
  const hero=document.querySelector('.profileHero'),cover=document.querySelector('.profileCover'),tabs=document.querySelector('.profileTabs');
  if(!hero||!cover||!tabs)return;
  const root=hero.closest('.card')||hero.parentElement;
  if(!root||root.dataset.phase51Busy==='1')return;
  const uid=(window.state?.profileViewId)||(window.state?.view==='profile'?window.state?.user?.id:null);
  if(!uid)return;
  const stamp=uid+'|'+(window.state?.profileTab||'');
  if(root.dataset.phase51===stamp)return;
  root.dataset.phase51Busy='1';
  try{
    let p=window.state?.profiles?.get?.(uid)||null;
    if(!p){const r=await sb.from('profiles').select('*').eq('id',uid).maybeSingle();p=r.data||null}
    if(!p)return;
    const own=uid===window.state?.user?.id;
    const [exR,safeR]=await Promise.all([
      sb.from('kinfolk_profile_extras').select('*').eq('user_id',uid).maybeSingle(),
      own?sb.from('kinfolk_safety_settings').select('*').eq('user_id',uid).maybeSingle():Promise.resolve({data:null})
    ]);
    const ex=exR.data||{},safe=safeR.data||{};
    root.classList.add('kf51Profile');root.dataset.layout=p.profile_layout||'classic';root.style.setProperty('--kf51-accent',p.accent_color||'#e85a9b');
    if(own&&window.applyKinfolkTheme)window.applyKinfolkTheme(p.accent_color||'#e85a9b');
    root.querySelectorAll('.kf51Info,.kf51Music').forEach(x=>x.remove());cover.querySelector('.kf51Wallpaper')?.remove();
    let wallpaper='';
    if(own)wallpaper=safe.animated_wallpaper_url||'';
    if(!wallpaper&&p.wallpaper_url){try{wallpaper=await signed('kinfolk-media',p.wallpaper_url)||''}catch(_){wallpaper=''}}
    if(wallpaper){
      const w=document.createElement('div');w.className='kf51Wallpaper';
      const video=/\.(mp4|webm|mov)(\?|$)/i.test(wallpaper);
      if(video&&safe.wallpaper_motion_enabled!==false&&!matchMedia('(prefers-reduced-motion: reduce)').matches)w.innerHTML=`<video ${safe.wallpaper_autoplay?'autoplay':''} loop muted playsinline src="${esc(wallpaper)}"></video><div class="kf51WallpaperShade"></div>`;
      else w.innerHTML=`<img src="${esc(wallpaper)}" alt=""><div class="kf51WallpaperShade"></div>`;
      cover.prepend(w);
    }
    const info=[];
    if(ex.location_text||p.location_text)info.push(['📍',ex.location_text||p.location_text]);
    if(ex.gender)info.push(['',ex.gender]);
    if(ex.orientation)info.push(['',ex.orientation]);
    if(ex.relationship_status)info.push(['♡',ex.relationship_status]);
    const zodiac=signFor(ex.birthday);if(zodiac)info.push(['✦',zodiac]);
    if(info.length){const line=document.createElement('div');line.className='kf51Info';line.innerHTML=info.map(([i,t])=>`<span class="kf51Chip">${i?esc(i)+' ':''}${esc(t)}</span>`).join('');hero.after(line)}
    const music=ex.music_url||p.profile_music_url||'';
    if(music){
      const m=document.createElement('div');m.className='kf51Music';
      const direct=/\.(mp3|m4a|aac|ogg|wav)(\?|$)/i.test(music);
      m.innerHTML=`<div class="kf51MusicRow"><div><b>♫ Profile music</b><div class="kf51Badge"><i class="kf51Dot"></i>${direct?'Ready to play':'Linked track'}</div></div><a href="${esc(music)}" target="_blank" rel="noopener">Open</a></div>${direct?`<audio controls preload="none" src="${esc(music)}"></audio>`:''}`;
      const infoLine=root.querySelector('.kf51Info');(infoLine||hero).after(m);
    }
    root.dataset.phase51=stamp;
  }catch(e){console.warn('Kinfolk profile integration',e)}finally{root.dataset.phase51Busy='0'}
}
let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(enhanceProfile,100)}).observe(document.documentElement,{subtree:true,childList:true});
window.refreshKinfolkProfileVisuals=enhanceProfile;
setTimeout(enhanceProfile,700);
})();
;

;
(function(){
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IMG=new Set(['image/jpeg','image/png','image/webp','image/gif']);
const ext=f=>({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'}[f.type]||'bin');
const css=document.createElement('style');css.textContent=`
.kf52Panel{margin:14px 0 0;padding:14px;border-radius:18px;background:rgba(10,10,14,.82);border:1px solid color-mix(in srgb,var(--accent) 25%,rgba(255,255,255,.09))}.kf52Title{font-weight:900;margin-bottom:8px}.kf52Grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.kf52Btn{border:0;border-radius:14px;padding:11px 12px;background:color-mix(in srgb,var(--accent) 17%,rgba(255,255,255,.06));color:inherit;font-weight:800}.kf52Hint{font-size:12px;color:var(--muted,#999);line-height:1.4;margin-top:8px}.kf52Progress{height:5px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:10px;display:none}.kf52Progress i{display:block;height:100%;width:0;background:var(--accent,#e85a9b);transition:width .2s}.kf52MusicEdit{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.kf52MusicEdit input{min-width:0;border:1px solid rgba(255,255,255,.12);background:#111118;color:inherit;border-radius:12px;padding:10px}.kf52Save{border:0;border-radius:12px;padding:10px 13px;background:var(--accent,#e85a9b);color:#fff;font-weight:900}
`;document.head.appendChild(css);
async function oldPath(kind){const p=state?.profile||{};return kind==='avatar'?p.avatar_url:p.wallpaper_url}
async function uploadProfileImage(kind,file,box){
 if(!state?.user||!file)return;
 if(!IMG.has(file.type))return toast('Use JPG, PNG, WebP or GIF','danger');
 if(file.size>5*1024*1024)return toast('Image must be 5 MB or smaller','danger');
 const bar=box.querySelector('.kf52Progress'),fill=bar.querySelector('i'),hint=box.querySelector('.kf52Hint');bar.style.display='block';fill.style.width='22%';hint.textContent='Uploading…';
 const path=`${state.user.id}/profile/${kind}-${Date.now()}.${ext(file)}`;
 const previous=await oldPath(kind);
 try{
   const up=await sb.storage.from('kinfolk-media').upload(path,file,{upsert:false,cacheControl:'3600',contentType:file.type});if(up.error)throw up.error;
   fill.style.width='66%';
   const payload=kind==='avatar'?{avatar_url:path}:{wallpaper_url:path};
   const r=await sb.from('profiles').update(payload).eq('id',state.user.id).select().single();if(r.error)throw r.error;
   state.profile=r.data;state.profiles?.set?.(r.data.id,r.data);fill.style.width='100%';hint.textContent=kind==='avatar'?'Profile picture updated.':'Profile wallpaper updated.';
   if(previous&&previous!==path&&String(previous).startsWith(state.user.id+'/')){try{await sb.storage.from('kinfolk-media').remove([previous])}catch(_){}}
   await renderApp();setTimeout(()=>window.refreshKinfolkProfileVisuals?.(),120);toast(kind==='avatar'?'Profile picture updated':'Wallpaper updated','good');
 }catch(err){try{await sb.storage.from('kinfolk-media').remove([path])}catch(_){}fill.style.width='0';hint.textContent=err.message||'Upload failed';toast(err.message||'Upload failed','danger')}
}
window.kf52Pick=function(kind){document.getElementById('kf52-'+kind)?.click()};
window.kf52File=function(kind,input){const f=input.files?.[0],box=input.closest('.kf52Panel');if(f&&box)uploadProfileImage(kind,f,box)};
window.kf52SaveMusic=async function(btn){
 const box=btn.closest('.kf52Panel'),input=box.querySelector('input[type=url]'),url=input.value.trim();
 if(url&&!/^https?:\/\//i.test(url))return toast('Use a full https:// link','danger');
 btn.disabled=true;btn.textContent='Saving…';
 const r=await sb.from('kinfolk_profile_extras').upsert({user_id:state.user.id,music_url:url||null,updated_at:new Date().toISOString()},{onConflict:'user_id'});btn.disabled=false;btn.textContent='Save';if(r.error)return toast(r.error.message,'danger');
 window.refreshKinfolkProfileVisuals?.();toast(url?'Profile music saved':'Profile music removed','good');
};
async function mount(){
 const hero=document.querySelector('.profileHero');if(!hero||!state?.user)return;const root=hero.closest('.card')||hero.parentElement;if(!root)return;
 const uid=state.profileViewId||(state.view==='profile'?state.user.id:null);if(uid!==state.user.id)return;if(root.querySelector('.kf52Panel'))return;
 let ex={};try{ex=(await sb.from('kinfolk_profile_extras').select('*').eq('user_id',state.user.id).maybeSingle()).data||{}}catch(_){}
 const panel=document.createElement('div');panel.className='kf52Panel';panel.innerHTML=`<div class="kf52Title">Customize profile</div><div class="kf52Grid"><button class="kf52Btn" type="button" onclick="kf52Pick('avatar')">Change photo</button><button class="kf52Btn" type="button" onclick="kf52Pick('wallpaper')">Change wallpaper</button></div><input id="kf52-avatar" type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onchange="kf52File('avatar',this)"><input id="kf52-wallpaper" type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onchange="kf52File('wallpaper',this)"><div class="kf52Hint">JPG, PNG, WebP or GIF, up to 5 MB. GIF wallpaper can animate and remains visible to people who can view your profile.</div><div class="kf52Progress"><i></i></div><div class="kf52MusicEdit"><input type="url" value="${E(ex.music_url||state.profile?.profile_music_url||'')}" placeholder="YouTube or music link"><button class="kf52Save" type="button" onclick="kf52SaveMusic(this)">Save</button></div><div class="kf52Hint">Music links are supported now. Phone audio upload needs a proper audio storage policy, so Kinfolk will not fake that feature.</div>`;
 const music=root.querySelector('.kf51Music'),info=root.querySelector('.kf51Info');(music||info||hero).after(panel)
}
let mt;new MutationObserver(()=>{clearTimeout(mt);mt=setTimeout(mount,120)}).observe(document.documentElement,{subtree:true,childList:true});setTimeout(mount,850);
})();
;

;
(function(){
const css=document.createElement('style');css.textContent=`
#kf53SettingsBtn{margin-left:8px;border:1px solid color-mix(in srgb,var(--accent,#e85a9b) 55%,rgba(255,255,255,.16));background:color-mix(in srgb,var(--accent,#e85a9b) 12%,#111118);color:inherit;border-radius:14px;padding:11px 16px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;gap:7px}
@media(max-width:520px){#kf53SettingsBtn{margin-left:8px;padding:11px 14px}}
`;document.head.appendChild(css);

function dedupeCustomizer(){
  const panels=[...document.querySelectorAll('.kf52Panel')];
  if(!panels.length)return null;
  const keep=panels[0];
  keep.id='kf52ProfilePanel';
  panels.slice(1).forEach(p=>p.remove());
  return keep;
}

function addSettingsButton(){
  if(!window.state?.user)return;
  const existing=document.getElementById('kf53SettingsBtn');
  if(existing&&document.contains(existing))return;
  const buttons=[...document.querySelectorAll('button,.btn')];
  const edit=buttons.find(b=>/^edit profile$/i.test((b.textContent||'').trim()));
  if(!edit)return;
  const btn=document.createElement('button');
  btn.id='kf53SettingsBtn';
  btn.type='button';
  btn.innerHTML='⚙ Settings';
  btn.onclick=()=>{
    if(typeof window.openKinfolkSettings==='function') window.openKinfolkSettings();
    else if(typeof window.go==='function') window.go('settings');
    else alert('Settings is temporarily unavailable.');
  };
  edit.insertAdjacentElement('afterend',btn);
}

function repair(){
  dedupeCustomizer();
  addSettingsButton();
}

let timer;
const obs=new MutationObserver(()=>{
  clearTimeout(timer);
  timer=setTimeout(repair,80);
});
obs.observe(document.documentElement,{subtree:true,childList:true});

setInterval(()=>{
  if(document.visibilityState==='visible')repair();
},1200);

setTimeout(repair,250);
setTimeout(repair,900);
})();
;

;
(function(){
const X=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');css.textContent=`
.kf54Profile{background:#18181f!important;border-radius:0!important;border:0!important;overflow:visible!important}.kf54Profile .profileCover{min-height:245px!important;border-radius:0 0 22px 22px!important}.kf54Profile .profileHero{margin-top:-54px!important;padding:0 20px 18px!important;background:#18181f!important;border-radius:22px 22px 0 0!important}.kf54Profile .profileAvatar,.kf54Profile .avatarBig{width:132px!important;height:132px!important;border:5px solid #18181f!important;box-shadow:0 6px 18px rgba(0,0,0,.38)}.kf54Profile .profileName,.kf54Profile h2{font-size:30px!important;line-height:1.08!important;margin-top:8px!important}.kf54Profile .profileTabs{margin-top:0!important;border-top:1px solid rgba(255,255,255,.08)!important;border-bottom:1px solid rgba(255,255,255,.08)!important;overflow-x:auto;scrollbar-width:none}.kf54Profile .profileTabs button,.kf54Profile .profileTabs .tab{min-width:92px;padding:15px 16px!important;font-weight:800!important}.kf54Profile .kf52Panel{display:none!important}.kf54OwnActions{display:grid;grid-template-columns:1fr auto;gap:10px;margin:10px 0 4px}.kf54Settings{border:0;border-radius:14px;padding:12px 17px;background:#3b3b43;color:#fff;font-weight:900}.kf54Glance,.kf54Friends{padding:18px 20px;background:#18181f;border-top:8px solid #111118}.kf54Head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.kf54Head h3{margin:0;font-size:22px}.kf54Head button{border:0;background:none;color:var(--accent,#e85a9b);font-weight:800}.kf54Facts{display:grid;gap:11px}.kf54Fact{display:flex;align-items:flex-start;gap:11px;font-size:15px}.kf54Fact i{font-style:normal;font-size:19px;width:22px;text-align:center}.kf54FriendRow{display:flex;gap:15px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px}.kf54Friend{width:82px;flex:0 0 82px;text-align:center}.kf54Friend img,.kf54Friend .ph{width:72px;height:72px;border-radius:50%;object-fit:cover;background:#30303a;display:block;margin:auto}.kf54Friend b{display:block;font-size:12px;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kf54Composer{padding:16px 20px;background:#18181f;border-top:8px solid #111118;display:flex;align-items:center;gap:10px}.kf54Composer button{flex:1;border:0;border-radius:999px;background:#2b2b33;color:#ddd;text-align:left;padding:12px 16px;font:inherit}.kf54MusicState{display:flex;align-items:center;gap:8px;font-size:12px;color:#bbb;margin-top:6px}.kf54MusicDot{width:8px;height:8px;border-radius:50%;background:var(--accent,#e85a9b);box-shadow:0 0 12px var(--accent,#e85a9b)}#kf54YT{position:fixed;width:1px;height:1px;opacity:.001;pointer-events:none;left:-10px;top:-10px}
`;
document.head.appendChild(css);
function ytId(u){try{const z=new URL(u);if(z.hostname.includes('youtu.be'))return z.pathname.slice(1).split('/')[0];if(z.hostname.includes('youtube.com'))return z.searchParams.get('v')||z.pathname.split('/').filter(Boolean).pop()}catch{}return''}
async function profileData(uid){let ex={};try{ex=(await sb.from('kinfolk_profile_extras').select('*').eq('user_id',uid).maybeSingle()).data||{}}catch{}return ex}
function friendsFor(uid){const out=[];for(const r of (state.friendRequests||[])){if(r.status!=='accepted')continue;const id=r.sender_id===uid?r.receiver_id:r.receiver_id===uid?r.sender_id:null;if(id&&!out.includes(id))out.push(id)}return out}
async function signedAvatar(p){if(!p?.avatar_url)return'';try{return await signed('kinfolk-media',p.avatar_url)||''}catch{return''}}
async function setupMusic(){/* Profile music is managed exclusively by phase81 to avoid duplicate playback. */}
async function mount(){const hero=document.querySelector('.profileHero'),cover=document.querySelector('.profileCover'),tabs=document.querySelector('.profileTabs');if(!hero||!cover||!tabs||!state?.user)return;const root=hero.closest('.card')||hero.parentElement;if(!root)return;root.classList.add('kf54Profile');
 const uid=state.profileViewId||(state.view==='profile'?state.user.id:null);if(!uid)return;const own=uid===state.user.id;const p=state.profiles?.get?.(uid)||state.profile||{};const ex=await profileData(uid);
 root.querySelectorAll('.kf54Glance,.kf54Friends,.kf54Composer,.kf54OwnActions').forEach(x=>x.remove());
 const settings=document.getElementById('kf53SettingsBtn');if(settings)settings.remove();
 if(own){const edit=[...root.querySelectorAll('button,.btn')].find(b=>/^edit profile$/i.test((b.textContent||'').trim()));if(edit){const row=document.createElement('div');row.className='kf54OwnActions';edit.parentElement?.insertBefore(row,edit);row.appendChild(edit);const s=document.createElement('button');s.className='kf54Settings';s.textContent='⚙ Settings';s.onclick=()=>window.openKinfolkSettings?.();row.appendChild(s)}}
 const labels=[...tabs.querySelectorAll('button,.tab')];labels.forEach(b=>{const t=(b.textContent||'').trim().toLowerCase();if(t==='posts')b.textContent='All';if(t==='videos')b.textContent='Reels'});
 const facts=[];if(ex.location_text||p.location_text)facts.push(['📍','Lives in '+(ex.location_text||p.location_text)]);if(ex.relationship_status)facts.push(['♡',ex.relationship_status]);if(ex.orientation)facts.push(['•',ex.orientation]);if(ex.gender)facts.push(['◉',ex.gender]);if(p.website_url)facts.push(['↗',p.website_url]);
 if(facts.length){const g=document.createElement('section');g.className='kf54Glance';g.innerHTML=`<div class="kf54Head"><h3>At a glance</h3>${own?'<button type="button">See all</button>':''}</div><div class="kf54Facts">${facts.map(([i,t])=>`<div class="kf54Fact"><i>${X(i)}</i><span>${X(t)}</span></div>`).join('')}</div>`;tabs.before(g)}
 const ids=friendsFor(uid),slice=ids.slice(0,6);if(slice.length){const fr=document.createElement('section');fr.className='kf54Friends';fr.innerHTML=`<div class="kf54Head"><h3>Friends</h3><button type="button">See all</button></div><div class="kf54FriendRow"></div>`;tabs.before(fr);const row=fr.querySelector('.kf54FriendRow');for(const id of slice){const fp=state.profiles?.get?.(id);const av=await signedAvatar(fp);const d=document.createElement('div');d.className='kf54Friend';d.innerHTML=`${av?`<img src="${X(av)}" alt="">`:'<span class="ph"></span>'}<b>${X(fp?.display_name||fp?.username||'Friend')}</b>`;d.onclick=()=>openProfile?.(id);row.appendChild(d)}}
 if(own){const c=document.createElement('div');c.className='kf54Composer';c.innerHTML='<button type="button">What\'s on your mind?</button>';c.querySelector('button').onclick=()=>{if(typeof window.openPostModal==='function')window.openPostModal();else if(typeof window.go==='function')window.go('home')};tabs.after(c)}
 await setupMusic(uid,ex)
}
let tm;new MutationObserver(()=>{clearTimeout(tm);tm=setTimeout(mount,120)}).observe(document.documentElement,{subtree:true,childList:true});setTimeout(mount,700);})();
;

;
(function(){
const css=document.createElement('style');css.textContent=`
.kf55Actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(120px,.48fr);gap:10px;padding:14px 20px 16px;background:#18181f;border-bottom:1px solid rgba(255,255,255,.07)}.kf55Actions button{border:0;border-radius:14px;padding:13px 16px;font:inherit;font-weight:900;color:#fff}.kf55Edit{background:var(--accent,#e85a9b)}.kf55Settings{background:#3b3b43}.kf55Actions[hidden]{display:none!important}@media(max-width:430px){.kf55Actions{padding-left:16px;padding-right:16px;grid-template-columns:1fr 132px}.kf55Actions button{padding:12px 10px;font-size:14px}}
`;document.head.appendChild(css);
let editAction=null;
function ownProfile(){const uid=window.state?.profileViewId||(window.state?.view==='profile'?window.state?.user?.id:null);return !!uid&&uid===window.state?.user?.id}
function captureEdit(){const candidates=[...document.querySelectorAll('button,.btn')];const btn=candidates.find(b=>/^edit profile$/i.test((b.textContent||'').trim())&&!b.closest('.kf55Actions'));if(!btn)return;const fn=btn.onclick;if(typeof fn==='function')editAction=e=>fn.call(btn,e);else{const attr=btn.getAttribute('onclick');if(attr)editAction=()=>{try{Function(attr).call(btn)}catch(err){console.warn('Kinfolk edit profile',err)}}}}
function openEdit(){if(editAction){try{return editAction(new Event('click'))}catch(_){}}for(const name of ['openEditProfile','openProfileEdit','editProfile','openProfileModal']){if(typeof window[name]==='function'){try{return window[name]()}catch(_){}}}const btn=[...document.querySelectorAll('button,.btn')].find(b=>/^edit profile$/i.test((b.textContent||'').trim())&&!b.closest('.kf55Actions'));if(btn)return btn.click();window.toast?.('Edit Profile is still loading. Try once more.','danger')}
function openSettings(){if(typeof window.openKinfolkSettings==='function')return window.openKinfolkSettings();if(typeof window.go==='function')return window.go('settings');window.toast?.('Settings is still loading. Try once more.','danger')}
function mount(){captureEdit();const hero=document.querySelector('.profileHero'),tabs=document.querySelector('.profileTabs');if(!hero||!tabs)return;const root=hero.closest('.card')||hero.parentElement;if(!root)return;let row=root.querySelector('.kf55Actions');if(!ownProfile()){row?.remove();return}if(!row){row=document.createElement('div');row.className='kf55Actions';row.innerHTML='<button class="kf55Edit" type="button">✎ Edit profile</button><button class="kf55Settings" type="button">⚙ Settings</button>';row.querySelector('.kf55Edit').onclick=openEdit;row.querySelector('.kf55Settings').onclick=openSettings;const glance=root.querySelector('.kf54Glance');if(glance)root.insertBefore(row,glance);else hero.after(row)}row.hidden=false;const legacy=root.querySelector('.kf54OwnActions');if(legacy)legacy.style.display='none';root.querySelectorAll('button,.btn').forEach(btn=>{if(!btn.closest('.kf55Actions')&&/^edit profile$/i.test((btn.textContent||'').trim()))btn.style.display='none'})}
let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(mount,60)}).observe(document.documentElement,{subtree:true,childList:true});setInterval(()=>{if(document.visibilityState==='visible')mount()},900);setTimeout(mount,120);setTimeout(mount,780);})();
;

;
(function(){
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');css.textContent=`
.kf56Sheet{position:fixed;inset:0;z-index:10040;background:#111118;color:#fff;display:flex;flex-direction:column}.kf56Top{position:sticky;top:0;display:flex;align-items:center;gap:12px;padding:14px 16px;background:#18181f;border-bottom:1px solid rgba(255,255,255,.08);z-index:2}.kf56Back{width:42px;height:42px;border:0;border-radius:50%;background:#2d2d35;color:#fff;font-size:22px}.kf56Top h2{margin:0;font-size:20px}.kf56Body{padding:16px 16px 96px;overflow:auto}.kf56List{display:grid;gap:10px}.kf56Fact{display:flex;gap:12px;align-items:center;padding:14px;border-radius:16px;background:#1c1c24}.kf56Fact b{display:block;font-size:13px;color:#aaa;margin-bottom:3px}.kf56People{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.kf56Person{text-align:center;min-width:0}.kf56Person img,.kf56Person .ph{width:76px;height:76px;border-radius:50%;object-fit:cover;background:#30303a;display:block;margin:auto}.kf56Person b{font-size:12px;display:block;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kf56Grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px}.kf56Photo{aspect-ratio:1;background:#222;overflow:hidden}.kf56Photo img{width:100%;height:100%;object-fit:cover;display:block}.kf56Videos{display:grid;gap:14px}.kf56Video{background:#1b1b22;border-radius:16px;overflow:hidden}.kf56Video video{display:block;width:100%;max-height:68vh;background:#000}.kf56Meta{padding:10px 12px}.kf56Empty{padding:44px 16px;text-align:center;color:#aaa}.kf56LabelFix .kf54Fact span strong{display:block;color:#aaa;font-size:12px;margin-bottom:2px}.kf56Count{color:#aaa;font-size:13px;margin-left:auto}
`;document.head.appendChild(css);
function uid(){return state?.profileViewId||(state?.view==='profile'?state?.user?.id:null)}
function friendIds(id){const out=[];for(const r of (state?.friendRequests||[])){if(r.status!=='accepted')continue;const x=r.sender_id===id?r.receiver_id:r.receiver_id===id?r.sender_id:null;if(x&&!out.includes(x))out.push(x)}return out}
async function media(bucket,path){if(!path)return'';if(/^https?:/i.test(path))return path;try{return await signed(bucket,path)||''}catch{return''}}
function sheet(title){document.querySelector('.kf56Sheet')?.remove();const s=document.createElement('section');s.className='kf56Sheet';s.innerHTML=`<div class="kf56Top"><button class="kf56Back" type="button">‹</button><h2>${esc(title)}</h2><span class="kf56Count"></span></div><div class="kf56Body"></div>`;s.querySelector('.kf56Back').onclick=()=>{s.remove();if(history.state?.kf56)history.back()};document.body.appendChild(s);try{history.pushState({...history.state,kf56:true},'')}catch{}return s}
window.addEventListener('popstate',()=>document.querySelector('.kf56Sheet')?.remove());
async function extras(id){try{return (await sb.from('kinfolk_profile_extras').select('*').eq('user_id',id).maybeSingle()).data||{}}catch{return{}}}
async function openAbout(){const id=uid();if(!id)return;const p=state.profiles?.get?.(id)||{},ex=await extras(id),s=sheet('About'),body=s.querySelector('.kf56Body');const rows=[['Display name',p.display_name],['Username',p.username?('@'+p.username):''],['Bio',p.bio],['Location',ex.location_text||p.location_text],['Gender',ex.gender],['Orientation',ex.orientation],['Relationship',ex.relationship_status],['Birthday',ex.birthday],['Website',p.website_url],['Profile layout',p.profile_layout]].filter(x=>x[1]);body.innerHTML=rows.length?`<div class="kf56List">${rows.map(([a,b])=>`<div class="kf56Fact"><div><b>${esc(a)}</b><span>${esc(b)}</span></div></div>`).join('')}</div>`:'<div class="kf56Empty">No profile details have been added yet.</div>';s.querySelector('.kf56Count').textContent=rows.length?`${rows.length} details`:''}
async function openFriends(){const id=uid();if(!id)return;const ids=friendIds(id),s=sheet('Friends'),body=s.querySelector('.kf56Body');s.querySelector('.kf56Count').textContent=`${ids.length} friend${ids.length===1?'':'s'}`;if(!ids.length){body.innerHTML='<div class="kf56Empty">No friends to show yet.</div>';return}const grid=document.createElement('div');grid.className='kf56People';body.appendChild(grid);for(const x of ids){const p=state.profiles?.get?.(x)||{};const av=await media('kinfolk-media',p.avatar_url);const d=document.createElement('button');d.type='button';d.className='kf56Person';d.style.cssText='border:0;background:none;color:inherit;padding:0';d.innerHTML=`${av?`<img src="${esc(av)}" alt="">`:'<span class="ph"></span>'}<b>${esc(p.display_name||p.username||'Friend')}</b>`;d.onclick=()=>{document.querySelector('.kf56Sheet')?.remove();openProfile?.(x)};grid.appendChild(d)}}
async function openPhotos(){const id=uid();if(!id)return;const posts=(state.posts||[]).filter(p=>p.author_id===id&&p.media_url),s=sheet('Photos'),body=s.querySelector('.kf56Body');s.querySelector('.kf56Count').textContent=`${posts.length} photo${posts.length===1?'':'s'}`;if(!posts.length){body.innerHTML='<div class="kf56Empty">No photos yet.</div>';return}const grid=document.createElement('div');grid.className='kf56Grid';body.appendChild(grid);for(const p of posts){const u=await media('kinfolk-media',p.media_url);if(!u)continue;const d=document.createElement('div');d.className='kf56Photo';d.innerHTML=`<img src="${esc(u)}" alt="">`;grid.appendChild(d)}}
async function openReels(){const id=uid();if(!id)return;const vids=(state.videos||[]).filter(v=>v.creator_id===id&&v.kind==='reel'),s=sheet('Reels'),body=s.querySelector('.kf56Body');s.querySelector('.kf56Count').textContent=`${vids.length} reel${vids.length===1?'':'s'}`;if(!vids.length){body.innerHTML='<div class="kf56Empty">No reels yet.</div>';return}const wrap=document.createElement('div');wrap.className='kf56Videos';body.appendChild(wrap);for(const v of vids){const u=v.source_type==='upload'?await media('kinfolk-video',v.storage_path):v.video_url;const c=document.createElement('div');c.className='kf56Video';c.innerHTML=`${u&&!/youtu(?:\.be|be\.com)/i.test(u)?`<video src="${esc(u)}" controls playsinline preload="metadata"></video>`:u?`<div style="padding:28px 16px;text-align:center"><a class="btn" href="${esc(u)}" target="_blank" rel="noopener">Open Reel ↗</a></div>`:'<div class="kf56Empty">Preview unavailable.</div>'}<div class="kf56Meta"><b>${esc(v.title||'Reel')}</b>${v.description?`<div class="muted" style="margin-top:5px">${esc(v.description)}</div>`:''}</div>`;wrap.appendChild(c)}}
async function fixGlance(){const id=uid(),g=document.querySelector('.kf54Glance');if(!id||!g)return;const p=state.profiles?.get?.(id)||{},ex=await extras(id),items=[['Location',ex.location_text||p.location_text,'📍'],['Relationship',ex.relationship_status,'♡'],['Orientation',ex.orientation,'•'],['Gender',ex.gender,'◉'],['Website',p.website_url,'↗']].filter(x=>x[1]);const facts=g.querySelector('.kf54Facts');if(facts){g.classList.add('kf56LabelFix');facts.innerHTML=items.map(([label,val,icon])=>`<div class="kf54Fact"><i>${esc(icon)}</i><span><strong>${esc(label)}</strong>${esc(val)}</span></div>`).join('')}const see=g.querySelector('.kf54Head button');if(see)see.onclick=openAbout}
function bind(){const tabs=document.querySelector('.profileTabs');if(!tabs)return;for(const b of tabs.querySelectorAll('button,.tab')){if(b.dataset.kf56)return;const t=(b.textContent||'').trim().toLowerCase();let fn=null;if(t==='about')fn=openAbout;else if(t==='friends')fn=openFriends;else if(t==='photos')fn=openPhotos;else if(t==='reels'||t==='videos')fn=openReels;if(fn){b.dataset.kf56='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();fn()},true)}}const f=document.querySelector('.kf54Friends .kf54Head button');if(f)f.onclick=openFriends;fixGlance()}
let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(bind,100)}).observe(document.documentElement,{subtree:true,childList:true});setInterval(()=>{if(document.visibilityState==='visible')bind()},1200);setTimeout(bind,500);
})();
;

;
(function(){
const css=document.createElement('style');css.textContent=`
.kf57Stats{display:flex;gap:16px;flex-wrap:wrap;margin-top:9px;color:#c9c9d1;font-size:13px}.kf57Stat{border:0;background:none;color:inherit;padding:0;font:inherit}.kf57Stat b{color:#fff;margin-right:4px}.kf57Stat.tap{cursor:pointer}.kf57MetaSolo{grid-template-columns:1fr!important}
`;document.head.appendChild(css);
function profileId(){return state?.profileViewId||(state?.view==='profile'?state?.user?.id:null)}
function friendCount(id){let n=0;for(const r of (state?.friendRequests||[])){if(r.status==='accepted'&&(r.sender_id===id||r.receiver_id===id))n++}return n}
function counts(id){const posts=(state?.posts||[]).filter(p=>p.author_id===id);const vids=(state?.videos||[]).filter(v=>v.creator_id===id);return{friends:friendCount(id),posts:posts.length,photos:posts.filter(p=>p.media_url).length,reels:vids.filter(v=>v.kind==='reel').length}}
function clickTab(label){const tabs=document.querySelector('.profileTabs');if(!tabs)return;const b=[...tabs.querySelectorAll('button,.tab')].find(x=>(x.textContent||'').trim().toLowerCase()===label);b?.click()}
function mountStats(){const id=profileId(),hero=document.querySelector('.profileHero');if(!id||!hero)return;const c=counts(id);let row=hero.querySelector('.kf57Stats');if(!row){row=document.createElement('div');row.className='kf57Stats';hero.appendChild(row)}row.innerHTML=`<button class="kf57Stat tap" data-k="friends"><b>${c.friends}</b> friends</button><span class="kf57Stat"><b>${c.posts}</b> posts</span><button class="kf57Stat tap" data-k="photos"><b>${c.photos}</b> photos</button><button class="kf57Stat tap" data-k="reels"><b>${c.reels}</b> reels</button>`;row.querySelector('[data-k="friends"]')?.addEventListener('click',()=>clickTab('friends'));row.querySelector('[data-k="photos"]')?.addEventListener('click',()=>clickTab('photos'));row.querySelector('[data-k="reels"]')?.addEventListener('click',()=>clickTab('reels'))}
function ageOn(b){if(!b)return null;const d=new Date(b+'T12:00:00');if(Number.isNaN(d.getTime()))return null;const now=new Date();let a=now.getFullYear()-d.getFullYear();const m=now.getMonth()-d.getMonth();if(m<0||(m===0&&now.getDate()<d.getDate()))a--;return a}
async function composerRules(kind){if(!state?.user?.id)return;let pref=null,safety=null;try{[pref,safety]=await Promise.all([sb.from('kinfolk_user_preferences').select('allow_post_location').eq('user_id',state.user.id).maybeSingle(),sb.from('kinfolk_safety_settings').select('birth_date').eq('user_id',state.user.id).maybeSingle()])}catch{}
 if(kind==='post'){const loc=document.getElementById('postLocation'),meta=loc?.closest('.kpMeta');if(loc&&pref?.data?.allow_post_location===false){loc.style.display='none';loc.value='';meta?.classList.add('kf57MetaSolo')}const rating=document.getElementById('postRating'),a=ageOn(safety?.data?.birth_date);if(rating&&a!==null&&a<18){rating.querySelector('option[value="mature"]')?.remove();rating.value='general'}}
 if(kind==='video'){const rating=document.getElementById('videoRating'),a=ageOn(safety?.data?.birth_date);if(rating&&a!==null&&a<18){rating.querySelector('option[value="mature"]')?.remove();rating.value='general'}}
}
const oldPost=window.openPostModal;if(typeof oldPost==='function'){window.openPostModal=function(){const r=oldPost.apply(this,arguments);setTimeout(()=>composerRules('post'),30);return r}}
const oldVideo=window.openVideoModal;if(typeof oldVideo==='function'){window.openVideoModal=function(){const r=oldVideo.apply(this,arguments);setTimeout(()=>composerRules('video'),30);return r}}
function wrapRefresh(name){const old=window[name];if(typeof old!=='function'||old.__kf57)return;const fn=async function(){const r=await old.apply(this,arguments);setTimeout(mountStats,80);setTimeout(mountStats,700);return r};fn.__kf57=true;window[name]=fn}
wrapRefresh('createPost');wrapRefresh('uploadVideo');
let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{mountStats();wrapRefresh('createPost');wrapRefresh('uploadVideo')},90)}).observe(document.documentElement,{subtree:true,childList:true});setInterval(()=>{if(document.visibilityState==='visible')mountStats()},1200);setTimeout(mountStats,500);
})();
;

;
(function(){
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');css.textContent=`
.kf58Bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.07);margin-top:10px}.kf58Btn{border:0;background:transparent;color:#d7d7df;padding:8px 10px;border-radius:10px;font:inherit;font-weight:700}.kf58Btn:hover,.kf58Btn:active{background:rgba(255,255,255,.06)}.kf58Btn.on{color:var(--accent,#e85a9b)}.kf58Count{font-size:12px;color:#a7a7b1}.kf58Comments{padding:0 12px 12px}.kf58Comment{display:flex;gap:9px;margin-top:10px}.kf58Avatar{width:30px;height:30px;border-radius:50%;background:#30303a;flex:0 0 30px;object-fit:cover}.kf58Bubble{background:#27272f;border-radius:14px;padding:9px 11px;min-width:0;flex:1}.kf58Bubble b{font-size:13px}.kf58Bubble p{margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}.kf58Meta{display:flex;gap:10px;align-items:center;margin:4px 0 0 40px;font-size:11px;color:#999}.kf58Meta button{border:0;background:none;color:#aaa;padding:0;font:inherit;font-weight:800}.kf58Reply{margin-left:38px}.kf58Compose{display:flex;gap:8px;margin-top:10px}.kf58Compose input{flex:1;min-width:0;border:1px solid rgba(255,255,255,.1);background:#202028;color:#fff;border-radius:999px;padding:10px 13px;font:inherit}.kf58Compose button{border:0;border-radius:999px;background:var(--accent,#e85a9b);color:#fff;padding:0 14px;font-weight:900}.kf58Replying{font-size:11px;color:#aaa;margin:8px 0 -4px 4px}.kf58Replying button{border:0;background:none;color:var(--accent,#e85a9b);font:inherit;font-weight:800}.kf58Refresh{margin-left:auto}.kf58Spinner{opacity:.6;pointer-events:none}
`;document.head.appendChild(css);
const cache=new Map();
function pmap(){const m=new Map();for(const p of (state?.posts||[]))m.set(String(p.id),p);return m}
function postIdFor(card){if(!card)return null;for(const k of ['postId','post','id']){const v=card.dataset?.[k];if(v&&pmap().has(String(v)))return String(v)}const id=card.id||'';for(const pid of pmap().keys())if(id.includes(pid))return pid;for(const el of card.querySelectorAll('[onclick]')){const s=el.getAttribute('onclick')||'';for(const pid of pmap().keys())if(s.includes(pid))return pid}return null}
function cards(){const out=[];const add=(card,id)=>{if(card&&id&&!out.some(x=>x.card===card||x.id===id))out.push({card,id})};for(const c of document.querySelectorAll('[data-post-id],[data-post],.postCard,.feedPost,.post'))add(c,postIdFor(c));for(const el of document.querySelectorAll('[onclick]')){const s=el.getAttribute('onclick')||'';for(const pid of pmap().keys())if(s.includes(pid)){add(el.closest('.postCard,.feedPost,.post,.card'),pid);break}}return out}
async function avatar(uid){const p=state?.profiles?.get?.(uid);if(!p?.avatar_url)return'';try{return await signed('kinfolk-media',p.avatar_url)||''}catch{return''}}
function fmtTime(v){try{return typeof fmt==='function'?fmt(v):new Date(v).toLocaleString()}catch{return''}}
async function fetchData(pid,force=false){if(!force&&cache.has(pid))return cache.get(pid);const [{data:likes,error:le},{data:comments,error:ce},{data:dislikes,error:de}]=await Promise.all([sb.from('post_likes').select('user_id,created_at').eq('post_id',pid),sb.from('comments').select('id,post_id,author_id,body,created_at,parent_id').eq('post_id',pid).order('created_at',{ascending:true}),sb.from('post_dislikes').select('user_id').eq('post_id',pid)]);if(le)throw le;if(ce)throw ce;const dislikesMissing=!!de&&['PGRST205','42P01'].includes(String(de.code||''));if(de&&!dislikesMissing)throw de;const dislikesReady=!de;const v={likes:likes||[],dislikes:dislikesReady?(dislikes||[]):[],dislikesReady,comments:comments||[]};cache.set(pid,v);return v}
async function toggleReaction(pid,btn,kind){btn.disabled=true;try{const d=await fetchData(pid,true);if(kind==='dislike'&&!d.dislikesReady)throw Error('Dislikes are temporarily unavailable while the update is being prepared');const mine=(kind==='like'?d.likes:d.dislikes).some(x=>x.user_id===state.user.id),own=kind==='like'?'post_likes':'post_dislikes',other=kind==='like'?'post_dislikes':'post_likes';if(!mine&&(d.dislikesReady||kind==='dislike')){const {error:clearError}=await sb.from(other).delete().eq('post_id',pid).eq('user_id',state.user.id);if(clearError)throw clearError}const {error}=await (mine?sb.from(own).delete().eq('post_id',pid).eq('user_id',state.user.id):sb.from(own).insert({post_id:pid,user_id:state.user.id}));if(error)throw error;cache.delete(pid);await renderOne(pid)}catch(e){toast(e.message||'Reaction failed','danger')}finally{btn.disabled=false}}
async function sendComment(pid,input,parent_id=null){const body=input.value.trim();if(!body)return;input.disabled=true;try{const{error}=await sb.from('comments').insert({post_id:pid,author_id:state.user.id,body,parent_id});if(error)throw error;input.value='';cache.delete(pid);await renderOne(pid);toast(parent_id?'Reply posted':'Comment posted','good')}catch(e){toast(e.message||'Comment failed','danger')}finally{input.disabled=false}}
async function delComment(pid,cid){try{const{error}=await sb.from('comments').delete().eq('id',cid).eq('author_id',state.user.id);if(error)throw error;cache.delete(pid);await renderOne(pid)}catch(e){toast(e.message||'Delete failed','danger')}}
async function commentHtml(c,children,pid){const p=state?.profiles?.get?.(c.author_id),av=await avatar(c.author_id),name=p?.display_name||p?.username||'Member';let h=`<div class="kf58Comment ${c.parent_id?'kf58Reply':''}" data-cid="${E(c.id)}">${av?`<img class="kf58Avatar" src="${E(av)}" alt="">`:'<span class="kf58Avatar"></span>'}<div class="kf58Bubble"><b>${E(name)}</b><p>${E(c.body)}</p></div></div><div class="kf58Meta ${c.parent_id?'kf58Reply':''}"><span>${E(fmtTime(c.created_at))}</span>${!c.parent_id?`<button type="button" data-reply="${E(c.id)}" data-name="${E(name)}">Reply</button>`:''}${c.author_id===state.user.id?`<button type="button" data-del="${E(c.id)}">Delete</button>`:''}</div>`;for(const r of children.get(c.id)||[])h+=await commentHtml(r,children,pid);return h}
async function renderOne(pid){const row=cards().find(x=>x.id===pid);if(!row)return;const card=row.card;card.dataset.postId=pid;let panel=card.querySelector(':scope > .kf58Panel');if(!panel){panel=document.createElement('div');panel.className='kf58Panel';card.appendChild(panel)}let d;try{d=await fetchData(pid,true)}catch(e){panel.innerHTML=`<div class="kf58Bar"><span class="kf58Count">Interactions unavailable</span><button class="kf58Btn kf58Refresh" type="button">Retry</button></div>`;panel.querySelector('button').onclick=()=>renderOne(pid);return}const liked=d.likes.some(x=>x.user_id===state.user.id),disliked=d.dislikes.some(x=>x.user_id===state.user.id),roots=d.comments.filter(x=>!x.parent_id),children=new Map();for(const c of d.comments.filter(x=>x.parent_id)){if(!children.has(c.parent_id))children.set(c.parent_id,[]);children.get(c.parent_id).push(c)}let comments='';for(const c of roots)comments+=await commentHtml(c,children,pid);panel.innerHTML=`<div class="kf58Bar"><button class="kf58Btn ${liked?'on':''}" data-like type="button" aria-pressed="${liked}">♥ ${liked?'Liked':'Like'}</button><span class="kf58Count">${d.likes.length} like${d.likes.length===1?'':'s'}</span><button class="kf58Btn ${disliked?'on':''}" data-dislike type="button" aria-pressed="${disliked}" ${d.dislikesReady?'':'disabled title="Dislikes are being prepared"'}>👎 ${disliked?'Disliked':'Dislike'}</button><span class="kf58Count">${d.dislikes.length} dislike${d.dislikes.length===1?'':'s'}</span><button class="kf58Btn" data-focus type="button">💬 Comment</button><span class="kf58Count">${d.comments.length} comment${d.comments.length===1?'':'s'}</span><button class="kf58Btn kf58Refresh" data-refresh type="button">↻</button></div><div class="kf58Comments">${comments||''}<div class="kf58Replying" style="display:none"></div><form class="kf58Compose"><input maxlength="1200" placeholder="Write a comment…"><button type="submit">Post</button></form></div>`;const input=panel.querySelector('.kf58Compose input'),replying=panel.querySelector('.kf58Replying');let parent=null;panel.querySelector('[data-like]').onclick=e=>toggleReaction(pid,e.currentTarget,'like');panel.querySelector('[data-dislike]').onclick=e=>toggleReaction(pid,e.currentTarget,'dislike');panel.querySelector('[data-focus]').onclick=()=>input.focus();panel.querySelector('[data-refresh]').onclick=()=>{cache.delete(pid);renderOne(pid)};panel.querySelector('.kf58Compose').onsubmit=e=>{e.preventDefault();sendComment(pid,input,parent)};panel.querySelectorAll('[data-reply]').forEach(b=>b.onclick=()=>{parent=b.dataset.reply;replying.style.display='block';replying.innerHTML=`Replying to ${E(b.dataset.name)} · <button type="button">Cancel</button>`;replying.querySelector('button').onclick=()=>{parent=null;replying.style.display='none';replying.textContent=''};input.focus()});panel.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>delComment(pid,b.dataset.del))}
let busy=false;async function mount(){if(busy||!state?.user)return;busy=true;try{for(const {card,id} of cards()){card.dataset.postId=id;if(!card.querySelector(':scope > .kf58Panel'))await renderOne(id)}}finally{busy=false}}
let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(mount,180)}).observe(document.documentElement,{subtree:true,childList:true});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){cache.clear();mount()}});setInterval(()=>{if(document.visibilityState==='visible')mount()},2500);setTimeout(mount,900);
})();
;

;
(function(){
  const css=document.createElement('style');
  css.textContent=`
  :root{--kf-safe-bottom:env(safe-area-inset-bottom,0px);--kf-safe-top:env(safe-area-inset-top,0px)}
  html{-webkit-text-size-adjust:100%;text-size-adjust:100%;scroll-behavior:auto}
  body{max-width:100vw;overflow-x:hidden;overscroll-behavior-y:contain}
  #app{max-width:100vw;overflow-x:hidden}
  img,video,canvas,svg{max-width:100%;height:auto}
  video{display:block}
  input,select,textarea,button{font-size:16px}
  button,[role="button"],a,input,select,textarea{touch-action:manipulation}
  button,[role="button"],a{min-height:44px}
  input,select,textarea{min-height:44px;box-sizing:border-box;max-width:100%}
  textarea{resize:vertical}
  .modal,.dialog,[role="dialog"],.sheet,.drawer{max-width:100vw}
  .tabs,.tabRow,.profileTabs,.segmented,.navTabs{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;white-space:nowrap}
  .tabs::-webkit-scrollbar,.tabRow::-webkit-scrollbar,.profileTabs::-webkit-scrollbar,.segmented::-webkit-scrollbar,.navTabs::-webkit-scrollbar{display:none}
  .card,.panel,.postCard,.feedPost,.post{min-width:0}
  .grid{min-width:0}
  .bottomNav,.bottom-nav,.appBottomNav,nav[aria-label="Bottom navigation"]{padding-bottom:calc(8px + var(--kf-safe-bottom))!important}
  @media(max-width:760px){
    body{padding-top:var(--kf-safe-top)}
    .container,.page,.content,.screen,.main{width:100%!important;max-width:100%!important;box-sizing:border-box}
    .modal,.dialog,[role="dialog"]{position:fixed!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;width:100%!important;max-width:none!important;max-height:88dvh!important;border-radius:22px 22px 0 0!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important}
    .sheet,.drawer{max-height:88dvh!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important}
    .row,.actions,.buttonRow,.profileActions{flex-wrap:wrap}
    .row>*,.actions>*,.buttonRow>*,.profileActions>*{min-width:0}
    .twoCol,.two-col,.columns,.settingsGrid,.profileGrid{grid-template-columns:1fr!important}
    .postCard,.feedPost,.post,.card{border-radius:0!important;margin-left:0!important;margin-right:0!important}
    .profileTabs,.tabs,.tabRow{padding-left:10px;padding-right:10px}
    .profileTabs>* ,.tabs>* ,.tabRow>*{flex:0 0 auto}
    .composer textarea,.composer input,.kf58Compose input{font-size:16px!important}
    .kf59Shell{padding-left:14px!important;padding-right:14px!important}
    .kf59Card{width:100%!important;max-width:460px!important}
    .kf59Card #authForm{padding:16px!important}
    .kf59Tabs button{min-height:46px}
    .kf55Actions,.kf54Actions,.kf53Actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;width:100%!important}
    .kf55Actions button,.kf54Actions button,.kf53Actions button{width:100%!important}
    .kf58Bar{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;gap:4px!important}
    .kf58Bar::-webkit-scrollbar{display:none}
    .kf58Btn{flex:0 0 auto;min-height:42px!important}
    .kf58Comments{padding-left:10px!important;padding-right:10px!important}
    .kf58Reply{margin-left:24px!important}
  }
  @media(max-width:430px){
    .kf59Logo{font-size:34px!important}
    .kf59Card #authForm{border-radius:20px!important}
    .kf59Tabs{border-radius:16px!important}
    .kf59Tabs button{padding-left:8px!important;padding-right:8px!important}
    .kf55Actions,.kf54Actions,.kf53Actions{grid-template-columns:1fr!important}
  }
  `;
  document.head.appendChild(css);
  function markMobile(){const mobile=window.matchMedia('(max-width:760px)').matches;document.documentElement.classList.toggle('kf-mobile',mobile);document.documentElement.classList.toggle('kf-desktop',!mobile)}
  markMobile();window.addEventListener('resize',markMobile,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(markMobile,120),{passive:true});
  function makeScrollable(el){if(!el||el.dataset.kf60Scroll)return;if((el.scrollWidth>el.clientWidth+8)||/(tabs|tab|nav)/i.test(el.className||'')){el.dataset.kf60Scroll='1';el.style.webkitOverflowScrolling='touch'}}
  function enhance(){document.querySelectorAll('.tabs,.tabRow,.profileTabs,.segmented,.navTabs').forEach(makeScrollable);document.querySelectorAll('input,textarea,select').forEach(el=>{if(!el.style.fontSize)el.style.fontSize='16px';if(el.tagName==='INPUT'&&(el.type==='email'||el.name?.toLowerCase().includes('email')))el.inputMode='email';if(el.tagName==='INPUT'&&/phone|mobile|tel/i.test((el.name||'')+' '+(el.placeholder||'')))el.inputMode='tel'});document.querySelectorAll('video').forEach(v=>{v.setAttribute('playsinline','');v.playsInline=true})}
  let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(enhance,80)}).observe(document.documentElement,{subtree:true,childList:true});setTimeout(enhance,0);setTimeout(enhance,700);
  document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')document.documentElement.classList.add('kf-touch')},{passive:true,once:true});
  if(window.visualViewport){let vv;visualViewport.addEventListener('resize',()=>{clearTimeout(vv);vv=setTimeout(()=>{document.documentElement.style.setProperty('--kf-vh',visualViewport.height+'px')},60)},{passive:true});document.documentElement.style.setProperty('--kf-vh',visualViewport.height+'px')}
})();
;

;
(function(){
const KEY='kinfolk_scroll_positions_v1';
const getView=()=>{try{return String(state?.view||'home')}catch{return'home'}};
const read=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch{return{}}};
const write=(m)=>{try{sessionStorage.setItem(KEY,JSON.stringify(m))}catch{}};
let lastView=getView(), switching=false, lastTap={view:'',at:0};
function saveScroll(view=lastView){const m=read();m[view]=Math.max(0,Math.round(window.scrollY||document.documentElement.scrollTop||0));write(m)}
function restoreScroll(view){const y=read()[view];if(Number.isFinite(y))requestAnimationFrame(()=>window.scrollTo({top:y,behavior:'auto'}))}
function isEditable(el){return !!el?.closest?.('input,textarea,select,[contenteditable="true"]')}
function closeTopLayer(){const selectors=['.kf56Sheet','.modal.open','.dialog.open','[role="dialog"][aria-modal="true"]','.sheet.open','.drawer.open'];for(const s of selectors){const el=document.querySelector(s);if(el&&getComputedStyle(el).display!=='none'){const btn=el.querySelector('[data-close],.close,.backBtn,button[aria-label*="close" i],button[aria-label*="back" i]');if(btn){btn.click();return true}}}return false}
function currentBottomButton(){const view=getView();const buttons=[...document.querySelectorAll('nav button,.bottomNav button,.bottom-nav button,.appBottomNav button,[data-view],[data-tab]')];return buttons.find(b=>{const k=(b.dataset.view||b.dataset.tab||b.getAttribute('aria-label')||b.textContent||'').trim().toLowerCase();return k===view.toLowerCase()||k.startsWith(view.toLowerCase())})}
function polishNav(){
 const bars=document.querySelectorAll('.bottomNav,.bottom-nav,.appBottomNav,nav[aria-label="Bottom navigation"]');
 bars.forEach(bar=>{bar.dataset.kf61='1';bar.style.transform='translateZ(0)';});
 const buttons=[...document.querySelectorAll('.bottomNav button,.bottom-nav button,.appBottomNav button,nav[aria-label="Bottom navigation"] button')];
 buttons.forEach(btn=>{
  if(btn.dataset.kf61Bound)return;btn.dataset.kf61Bound='1';
  btn.addEventListener('click',()=>{
    const key=(btn.dataset.view||btn.dataset.tab||btn.getAttribute('aria-label')||btn.textContent||'').trim().toLowerCase();
    const now=Date.now();
    if(key&&lastTap.view===key&&now-lastTap.at<550){window.scrollTo({top:0,behavior:'smooth'})}
    lastTap={view:key,at:now};
  },{passive:true});
 });
}
function viewWatch(){const v=getView();if(v!==lastView){saveScroll(lastView);lastView=v;setTimeout(()=>restoreScroll(v),120)}}
window.addEventListener('scroll',()=>{clearTimeout(window.__kf61scroll);window.__kf61scroll=setTimeout(()=>saveScroll(getView()),120)},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveScroll(getView())});
window.addEventListener('beforeunload',()=>saveScroll(getView()));
window.addEventListener('popstate',e=>{
 if(isEditable(document.activeElement)){document.activeElement.blur();return}
 if(closeTopLayer())return;
 try{
  if(state?.profileViewId){state.profileViewId=null;state.view='profile';if(typeof renderApp==='function')renderApp();return}
  if(state?.view&&state.view!=='home'){state.view='home';if(typeof renderApp==='function')renderApp();window.scrollTo({top:0,behavior:'auto'});return}
 }catch{}
});
if(!history.state?.kf61){try{history.replaceState({...history.state,kf61:true},'')}catch{}}
if(window.visualViewport){const adjust=()=>{const keyboard=Math.max(0,window.innerHeight-visualViewport.height-visualViewport.offsetTop);document.documentElement.style.setProperty('--kf61-keyboard',keyboard+'px');document.body.classList.toggle('kf61Keyboard',keyboard>120)};visualViewport.addEventListener('resize',adjust,{passive:true});visualViewport.addEventListener('scroll',adjust,{passive:true});adjust()}
const css=document.createElement('style');css.textContent=`
:root{--kf61-keyboard:0px}.kf61Keyboard .bottomNav,.kf61Keyboard .bottom-nav,.kf61Keyboard .appBottomNav,.kf61Keyboard nav[aria-label="Bottom navigation"]{transform:translateY(calc(var(--kf61-keyboard) * -1));transition:transform .12s ease}.kf61Keyboard .toast,.kf61Keyboard [role="status"]{bottom:calc(16px + var(--kf61-keyboard))!important}@media(max-width:760px){.bottomNav,.bottom-nav,.appBottomNav,nav[aria-label="Bottom navigation"]{position:sticky;bottom:0;z-index:40}.bottomNav button,.bottom-nav button,.appBottomNav button,nav[aria-label="Bottom navigation"] button{min-width:52px;min-height:52px}.topbar,.header,.appHeader{position:sticky;top:0;z-index:35;backdrop-filter:blur(14px)}body{padding-bottom:calc(8px + env(safe-area-inset-bottom,0px))}}
`;document.head.appendChild(css);
let moTimer;new MutationObserver(()=>{clearTimeout(moTimer);moTimer=setTimeout(polishNav,60)}).observe(document.documentElement,{subtree:true,childList:true});
setInterval(viewWatch,300);setTimeout(()=>{polishNav();restoreScroll(getView())},700);
})();
;

;
(function(){
const DRAFT='kinfolk_post_drafts_v1';
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
const readDrafts=()=>{try{return JSON.parse(sessionStorage.getItem(DRAFT)||'{}')}catch{return{}}};
const saveDraft=(key,val)=>{const d=readDrafts();if(val)d[key]=val;else delete d[key];try{sessionStorage.setItem(DRAFT,JSON.stringify(d))}catch{}};
const viewKey=()=>{try{return String(state?.view||'home')}catch{return'home'}};
function isPostComposer(el){if(!el)return false;const txt=((el.placeholder||'')+' '+(el.name||'')+' '+(el.id||'')+' '+(el.className||'')).toLowerCase();return /what.?s on your mind|create post|post body|composer|posttext|postcontent/.test(txt)}
function polishInputs(){
  qa('textarea,input[type="text"]').forEach(el=>{
    if(!isPostComposer(el)||el.dataset.kf62Draft)return;
    el.dataset.kf62Draft='1';
    const key='post:'+viewKey()+':'+(el.id||el.name||'main');
    const prior=readDrafts()[key];
    if(prior&&!el.value)el.value=prior;
    let t;el.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>saveDraft(key,el.value.trim()?el.value:''),150)});
    el.addEventListener('focus',()=>setTimeout(()=>el.scrollIntoView({block:'center',behavior:'smooth'}),250));
    const form=el.closest('form');if(form&&!form.dataset.kf62Draft){form.dataset.kf62Draft='1';form.addEventListener('submit',()=>setTimeout(()=>saveDraft(key,''),800))}
  });
}
function polishFiles(){
  qa('input[type="file"]').forEach(inp=>{
    if(inp.dataset.kf62)return;inp.dataset.kf62='1';
    const meta=((inp.accept||'')+' '+(inp.id||'')+' '+(inp.name||'')).toLowerCase();
    if(/image|photo|avatar|wallpaper/.test(meta)&&!inp.accept)inp.accept='image/*';
    if(/video|reel/.test(meta)&&!inp.accept)inp.accept='video/*';
    inp.addEventListener('change',()=>{
      const f=inp.files?.[0];if(!f)return;
      const host=inp.closest('.field,.row,.composer,.modal,.sheet,.card,form')||inp.parentElement;
      if(!host)return;
      host.querySelector('.kf62FileMeta')?.remove();
      const m=document.createElement('div');m.className='kf62FileMeta';
      const mb=(f.size/1048576).toFixed(f.size>10485760?0:1);
      m.textContent=`Selected: ${f.name} • ${mb} MB`;
      host.appendChild(m)
    })
  })
}
function polishMedia(){
  qa('img,video').forEach(m=>{if(m.dataset.kf62Media)return;m.dataset.kf62Media='1';if(m.tagName==='VIDEO'){m.setAttribute('playsinline','');m.playsInline=true;m.preload=m.preload||'metadata'}m.loading=m.loading||'lazy'});
}
function polishButtons(){
  qa('button').forEach(b=>{if(b.dataset.kf62Busy)return;b.dataset.kf62Busy='1';const t=(b.textContent||'').trim().toLowerCase();if(!/post|publish|upload|share|save/.test(t))return;b.addEventListener('click',()=>{if(b.disabled)return;const form=b.closest('form');if(form&&!form.checkValidity())return;b.classList.add('kf62Pressed');setTimeout(()=>b.classList.remove('kf62Pressed'),500)},{passive:true})})
}
function enhance(){polishInputs();polishFiles();polishMedia();polishButtons()}
const css=document.createElement('style');css.textContent=`
.kf62FileMeta{margin-top:8px;font-size:12px;color:#a9a6b2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kf62Pressed{transform:scale(.985)}
@media(max-width:760px){
  .composer,.postComposer,.createPost,.kf42Composer,.kf54Composer{padding-left:12px!important;padding-right:12px!important}
  .composer textarea,.postComposer textarea,.createPost textarea,.kf42Composer textarea,.kf54Composer textarea{width:100%!important;min-height:92px!important;line-height:1.4!important;border-radius:16px!important;padding:14px!important;box-sizing:border-box!important}
  input[type="file"]{max-width:100%;font-size:14px!important}
  input[type="file"]::file-selector-button{min-height:44px;border:0;border-radius:12px;padding:10px 14px;margin-right:10px;background:var(--accent,#e85a9b);color:white;font-weight:800}
  .postCard img,.feedPost img,.post img,.postCard video,.feedPost video,.post video,.kf43Video,.kf42Preview{width:100%!important;max-height:72dvh!important;object-fit:contain!important;background:#0b0b0f}
  .mediaGrid,.photoGrid,.reelGrid{gap:2px!important}
  .mediaGrid img,.photoGrid img,.reelGrid img,.mediaGrid video,.photoGrid video,.reelGrid video{aspect-ratio:1/1!important;object-fit:cover!important;width:100%!important}
  .composerActions,.postActions,.uploadActions{display:flex!important;gap:8px!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;padding-bottom:2px!important}
  .composerActions>*,.postActions>*,.uploadActions>*{flex:0 0 auto!important;min-height:44px!important}
  .modal input,.modal textarea,.modal select,.sheet input,.sheet textarea,.sheet select,[role="dialog"] input,[role="dialog"] textarea,[role="dialog"] select{width:100%!important;box-sizing:border-box!important}
}
@media(max-width:430px){.composerActions button,.postActions button,.uploadActions button{padding-left:12px!important;padding-right:12px!important}.kf62FileMeta{font-size:11px}}
`;
document.head.appendChild(css);
let mt;new MutationObserver(()=>{clearTimeout(mt);mt=setTimeout(enhance,60)}).observe(document.documentElement,{subtree:true,childList:true});
setTimeout(enhance,0);setTimeout(enhance,700);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(enhance,80)});
})();

;

;
(function(){const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];const isMessageView=()=>{try{return /message|chat|inbox/.test(String(state?.view||'').toLowerCase())}catch{return false}};function enhance(){qa('textarea,input[type="text"]').forEach(el=>{const m=((el.placeholder||'')+' '+(el.id||'')+' '+(el.name||'')+' '+(el.className||'')).toLowerCase();if(!/message|reply|chat/.test(m)||el.dataset.kf63)return;el.dataset.kf63='1';el.setAttribute('enterkeyhint','send');el.addEventListener('focus',()=>setTimeout(()=>el.scrollIntoView({block:'center',behavior:'smooth'}),220))});qa('[data-message-id],.message,.chatMessage,.bubble').forEach(m=>{if(!m.dataset.kf63){m.dataset.kf63='1';m.style.overflowWrap='anywhere'}});qa('.notification,[data-notification-id],.notificationItem,.alertItem').forEach(n=>{if(n.dataset.kf63)return;n.dataset.kf63='1';n.setAttribute('role',n.getAttribute('role')||'button');if(n.tabIndex<0)n.tabIndex=0});qa('.badge,.unreadBadge,[data-unread-count]').forEach(b=>{const n=parseInt((b.textContent||b.dataset.unreadCount||'').trim(),10);if(Number.isFinite(n)&&n>99)b.textContent='99+'});qa('.conversationList,.messageList,.chatList,.notificationList').forEach(el=>el.style.webkitOverflowScrolling='touch');if(isMessageView()){const l=q('.messages,.messageThread,.chatMessages,.conversationMessages,[data-message-thread]');if(l&&!l.dataset.kf63Init){l.dataset.kf63Init='1';requestAnimationFrame(()=>l.scrollTop=l.scrollHeight)}}}const css=document.createElement('style');css.textContent='@media(max-width:760px){.conversationList,.messageList,.chatList,.notificationList{max-height:none!important;overflow-y:auto!important}.conversationItem,.messagePreview,.chatPreview,.notification,.notificationItem,.alertItem{min-height:64px!important;padding:12px!important;box-sizing:border-box!important}.messages,.messageThread,.chatMessages,.conversationMessages,[data-message-thread]{max-height:calc(100dvh - 210px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding-bottom:12px!important}.messageComposer,.chatComposer,.messageInputRow{position:sticky!important;bottom:calc(68px + env(safe-area-inset-bottom,0px));z-index:45;background:#15151c!important;padding:8px 10px!important;display:flex!important;gap:8px!important;align-items:flex-end!important}.messageComposer textarea,.chatComposer textarea,.messageInputRow textarea,.messageComposer input,.chatComposer input,.messageInputRow input{flex:1!important;min-width:0!important;max-height:128px!important;min-height:44px!important;font-size:16px!important;border-radius:16px!important}.messageComposer button,.chatComposer button,.messageInputRow button{flex:0 0 auto!important;min-width:48px!important;min-height:44px!important}.message,.chatMessage,.bubble{max-width:84%!important;line-height:1.35!important;padding:10px 12px!important;border-radius:16px!important}.notification,.notificationItem,.alertItem{display:flex!important;gap:10px!important;align-items:flex-start!important}}';document.head.appendChild(css);let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(enhance,70)}).observe(document.documentElement,{subtree:true,childList:true});setTimeout(enhance,0);setTimeout(enhance,700)})();
;

;
(function(){
  const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const BANNER_ID='kf64NetworkBanner';
  function banner(){
    let b=document.getElementById(BANNER_ID);
    if(!b){
      b=document.createElement('div'); b.id=BANNER_ID; b.setAttribute('role','status'); b.setAttribute('aria-live','polite');
      b.innerHTML='<span class="kf64Dot"></span><span class="kf64Text"></span><button type="button" class="kf64Retry">Retry</button>';
      document.body.appendChild(b);
      b.querySelector('.kf64Retry').addEventListener('click',()=>location.reload());
    }
    return b;
  }
  function setNetwork(){
    const b=banner(), online=navigator.onLine!==false;
    b.classList.toggle('show',!online); b.classList.toggle('online',online);
    b.querySelector('.kf64Text').textContent=online?'Back online':'You’re offline. Kinfolk will reconnect when your connection returns.';
    b.querySelector('.kf64Retry').hidden=online;
    if(online){clearTimeout(window.__kf64NetHide); window.__kf64NetHide=setTimeout(()=>b.classList.remove('show'),1800)}
  }
  addEventListener('online',setNetwork); addEventListener('offline',setNetwork);

  function friendlyError(message){
    if(!message)return;
    const old=document.getElementById('kf64RuntimeNotice'); if(old)old.remove();
    const n=document.createElement('div'); n.id='kf64RuntimeNotice'; n.setAttribute('role','alert');
    n.innerHTML='<div><strong>Something didn’t finish loading.</strong><span></span></div><button type="button">Refresh</button>';
    n.querySelector('span').textContent=' Your account data is safe. Try refreshing this screen.';
    n.querySelector('button').onclick=()=>location.reload();
    document.body.appendChild(n); setTimeout(()=>n.classList.add('show'),10); setTimeout(()=>n.remove(),9000);
  }
  addEventListener('error',e=>{const m=String(e?.message||''); if(/ResizeObserver loop|Script error/i.test(m))return; console.warn('Kinfolk runtime error',e.error||m); friendlyError(m)});
  addEventListener('unhandledrejection',e=>{const m=String(e?.reason?.message||e?.reason||''); if(/AbortError|network request failed|fetch/i.test(m)&&navigator.onLine===false){setNetwork();return} console.warn('Kinfolk promise rejection',e.reason); friendlyError(m)});

  function protectForms(){
    qsa('form').forEach(f=>{
      if(f.dataset.kf64Guard)return; f.dataset.kf64Guard='1';
      f.addEventListener('submit',()=>{
        if(!f.checkValidity())return;
        const btn=f.querySelector('button[type="submit"],input[type="submit"]'); if(!btn||btn.dataset.kf64Busy==='1')return;
        btn.dataset.kf64Busy='1'; btn.dataset.kf64Text=btn.textContent||btn.value||''; btn.disabled=true;
        if('textContent' in btn) btn.textContent='Working…';
        setTimeout(()=>{if(!document.contains(btn))return; btn.disabled=false; btn.dataset.kf64Busy='0'; if(btn.tagName==='INPUT')btn.value=btn.dataset.kf64Text;else btn.textContent=btn.dataset.kf64Text;},12000);
      },true);
    });
  }

  function hardenAuth(){
    const email=qs('input[type="email"]'); if(email){email.autocomplete='email'; email.inputMode='email'; email.autocapitalize='none'; email.spellcheck=false}
    qsa('input[type="password"]').forEach(p=>{if(!p.autocomplete)p.autocomplete=/new|create|confirm|signup/i.test((p.name||'')+(p.id||'')+(p.placeholder||''))?'new-password':'current-password'});
    const loginForm=qs('#authForm,form[data-auth],.auth form'); if(loginForm)loginForm.setAttribute('novalidate','');
  }

  async function sessionProbe(){
    try{
      if(typeof sb==='undefined'||!sb?.auth?.getSession)return;
      const {data,error}=await sb.auth.getSession(); if(error)throw error;
      if(data?.session){document.documentElement.dataset.kf64Session='active'; return}
      document.documentElement.dataset.kf64Session='signedout';
    }catch(e){console.warn('Kinfolk session probe',e)}
  }

  function accessibility(){
    qsa('button,a,[role="button"]').forEach(el=>{
      if(el.dataset.kf64A11y)return; el.dataset.kf64A11y='1';
      if(el.tagName!=='A'&&!el.hasAttribute('type')&&el.tagName==='BUTTON')el.type='button';
      if(el.getAttribute('role')==='button'&&el.tabIndex<0)el.tabIndex=0;
    });
    qsa('img').forEach(i=>{if(!i.hasAttribute('alt'))i.alt=''})
  }

  function enhance(){protectForms();hardenAuth();accessibility()}
  const css=document.createElement('style'); css.textContent=`
#kf64NetworkBanner{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translate(-50%,-130%);z-index:99999;display:flex;align-items:center;gap:9px;max-width:min(92vw,520px);padding:10px 12px;border-radius:14px;background:#2a1720;color:#fff;box-shadow:0 10px 32px #0008;transition:transform .22s ease;font-size:13px}#kf64NetworkBanner.show{transform:translate(-50%,0)}#kf64NetworkBanner.online{background:#16321f}.kf64Dot{width:8px;height:8px;border-radius:50%;background:#ff7d9f}.online .kf64Dot{background:#75e69a}.kf64Retry{margin-left:auto;border:0;border-radius:10px;padding:7px 10px;background:#fff;color:#19151b;font-weight:800}#kf64RuntimeNotice{position:fixed;left:12px;right:12px;bottom:calc(82px + env(safe-area-inset-bottom,0px));z-index:99998;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;background:#2a1720;color:#fff;box-shadow:0 12px 34px #0008;opacity:0;transform:translateY(14px);transition:.2s}#kf64RuntimeNotice.show{opacity:1;transform:none}#kf64RuntimeNotice div{flex:1;min-width:0}#kf64RuntimeNotice span{font-size:12px;color:#d9cfd5}#kf64RuntimeNotice button{min-height:38px;border:0;border-radius:10px;padding:8px 11px;font-weight:800}@media(max-width:760px){button,a,[role="button"]{touch-action:manipulation}form button[type="submit"]{min-height:46px}#kf64RuntimeNotice{font-size:13px}}
  `; document.head.appendChild(css);
  let mt; new MutationObserver(()=>{clearTimeout(mt); mt=setTimeout(enhance,70)}).observe(document.documentElement,{subtree:true,childList:true});
  setNetwork(); enhance(); setTimeout(enhance,700); setTimeout(sessionProbe,900);
})();
;

;
(function(){
const LAST='kinfolk_last_view_v1', RELOAD='kinfolk_auth_recover_v1';
const validViews=new Set(['home','feed','profile','people','search','messages','notifications','reels','channels','communities','settings']);
function getView(){try{return String(state?.view||'home')}catch{return'home'}}
function setView(v){try{if(!validViews.has(v))return false;state.view=v;if(typeof renderApp==='function'){renderApp();return true}}catch(e){console.warn('Kinfolk restore view',e)}return false}
function remember(){const v=getView();if(validViews.has(v))try{sessionStorage.setItem(LAST,v)}catch{}}
function restore(){let v='';try{v=sessionStorage.getItem(LAST)||''}catch{}if(!v||v==='home'||!validViews.has(v))return;try{if(state?.user)setTimeout(()=>setView(v),180)}catch{}}
function authVisible(){return !!document.querySelector('#authForm,.kf59Auth,form[data-auth]')}
function recoverIfStale(){
 try{
  if(typeof sb==='undefined'||!sb?.auth?.getSession)return;
  sb.auth.getSession().then(({data,error})=>{
   if(error)return;
   const has=!!data?.session;
   document.documentElement.dataset.kf65Session=has?'active':'signedout';
   if(has&&authVisible()){
    let n=0;try{n=Number(sessionStorage.getItem(RELOAD)||0)}catch{}
    if(n<1){try{sessionStorage.setItem(RELOAD,'1')}catch{}void window.kf129ActivateSession?.(data.session)}
   }else if(has){try{sessionStorage.removeItem(RELOAD)}catch{}}
  })
 }catch(e){console.warn('Kinfolk session recovery',e)}
}
function installAuthListener(){
 try{
  if(typeof sb==='undefined'||!sb?.auth?.onAuthStateChange||window.__kf65Auth)return;
  window.__kf65Auth=true;
  sb.auth.onAuthStateChange((event,session)=>{
   document.documentElement.dataset.kf65Session=session?'active':'signedout';
   if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='USER_UPDATED'){
    try{sessionStorage.removeItem(RELOAD)}catch{}
    setTimeout(()=>{if(session&&authVisible())recoverIfStale()},450)
   }
   if(event==='SIGNED_OUT'){try{sessionStorage.removeItem(LAST);sessionStorage.removeItem(RELOAD)}catch{}}
  })
 }catch(e){console.warn('Kinfolk auth listener',e)}
}
function watchdog(){
 const txt=(document.body?.innerText||'').trim();
 if(/Loading Kinfolk/i.test(txt)&&!document.querySelector('.app,.shell,#app nav,#authForm')){
  if(document.getElementById('kf65StartHelp'))return;
  const d=document.createElement('div');d.id='kf65StartHelp';d.innerHTML='<strong>Kinfolk is taking longer than expected.</strong><button type="button">Try again</button>';
  d.querySelector('button').onclick=()=>location.reload();document.body.appendChild(d)
 }
}
function diag(){
 if(!new URLSearchParams(location.search).has('kinfolk_diag'))return;
 let p=document.getElementById('kf65Diag');if(!p){p=document.createElement('div');p.id='kf65Diag';p.innerHTML='<b>Kinfolk Launch Diagnostics</b><pre></pre><button type="button">Refresh</button>';p.querySelector('button').onclick=()=>location.reload();document.body.appendChild(p)}
 let session='unknown';try{session=document.documentElement.dataset.kf65Session||'unknown'}catch{}
 const data={session,view:getView(),online:navigator.onLine,width:innerWidth,height:innerHeight,touch:('ontouchstart'in window)||navigator.maxTouchPoints>0,time:new Date().toISOString()};p.querySelector('pre').textContent=JSON.stringify(data,null,2)
}
let last=getView();setInterval(()=>{const v=getView();if(v!==last){last=v;remember()}diag()},600);
addEventListener('pagehide',remember);addEventListener('online',()=>setTimeout(recoverIfStale,250));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(recoverIfStale,180)});
const css=document.createElement('style');css.textContent='#kf65StartHelp{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100000;background:#211d25;border:1px solid #3b3540;border-radius:16px;padding:18px;width:min(86vw,360px);box-shadow:0 18px 50px #0009;display:grid;gap:12px;text-align:center}#kf65StartHelp button,#kf65Diag button{border:0;border-radius:11px;padding:10px 12px;background:var(--accent,#e85a9b);color:#fff;font-weight:800}#kf65Diag{position:fixed;right:10px;bottom:90px;z-index:100001;width:min(88vw,330px);max-height:60vh;overflow:auto;background:#111117eF;border:1px solid #4a4450;border-radius:14px;padding:12px;box-shadow:0 12px 36px #000a;font-size:12px}#kf65Diag pre{white-space:pre-wrap;word-break:break-word;color:#d8d4df}';document.head.appendChild(css);
setTimeout(()=>{installAuthListener();recoverIfStale();restore();diag()},900);setTimeout(watchdog,12000);
})();
;

;
(function(){
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
function authArea(){return q('#authForm,.kf59Auth,form[data-auth],.auth form')}
function isSignup(){const f=authArea();if(!f)return false;const title=(f.querySelector('.kf73Title')?.textContent||'').trim().toLowerCase();if(title)return /create your kinfolk|sign up|signup/.test(title);const t=(f.innerText||'').toLowerCase();return /create account|sign up|signup/.test(t)&&!/welcome back|log in to kinfolk/.test(t)}
function ensureHint(input,text,kind='hint'){
  if(!input)return null;let n=input.parentElement?.querySelector('.kf66FieldMsg');
  if(!n){n=document.createElement('div');n.className='kf66FieldMsg';input.insertAdjacentElement('afterend',n)}
  n.dataset.kind=kind;n.textContent=text||'';n.hidden=!text;return n
}
function emailValid(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)}
function harden(){
 const form=authArea();if(!form)return;
 form.removeAttribute('novalidate');
 const email=form.querySelector('input[type="email"],input[name*="email" i]');
 if(email){email.required=true;email.autocomplete='email';email.inputMode='email';email.autocapitalize='none';email.spellcheck=false;
   if(!email.dataset.kf66){email.dataset.kf66='1';email.addEventListener('blur',()=>{const v=email.value.trim();ensureHint(email,v&&!emailValid(v)?'Enter a valid email address.':'',v&&!emailValid(v)?'error':'hint')});email.addEventListener('input',()=>ensureHint(email,''))}
 }
 const pw=[...form.querySelectorAll('input[type="password"]')];
 pw.forEach((p,i)=>{const signup=isSignup();if(signup){p.minLength=12;p.maxLength=128}else{p.removeAttribute('minlength');p.removeAttribute('maxlength')}p.required=true;p.autocomplete=signup?'new-password':'current-password';if(!p.dataset.kf66){p.dataset.kf66='1';p.addEventListener('input',()=>{const l=p.value.length;const bad=isSignup()&&l>0&&(l<12||l>128);ensureHint(p,bad?'Password must be 12 to 128 characters.':'',bad?'error':'hint')})}});
 const submit=form.querySelector('button[type="submit"],input[type="submit"]');
 if(submit&&!submit.dataset.kf66){submit.dataset.kf66='1';form.addEventListener('submit',e=>{
   let bad=false;
   if(email){const v=email.value.trim();if(!emailValid(v)){ensureHint(email,'Enter a valid email address.','error');bad=true}}
   pw.forEach(p=>{if(isSignup()&&(p.value.length<12||p.value.length>128)){ensureHint(p,'Password must be 12 to 128 characters.','error');bad=true}});
   if(pw.length>1&&pw[0].value!==pw[1].value){ensureHint(pw[1],'Passwords do not match.','error');bad=true}
   if(bad){e.preventDefault();e.stopImmediatePropagation();submit.disabled=false;submit.dataset.kf64Busy='0';const original=submit.dataset.kf64Text;if(original){if(submit.tagName==='INPUT')submit.value=original;else submit.textContent=original}form.querySelector('.kf66FieldMsg[data-kind="error"]')?.previousElementSibling?.focus();}
 },true)}
 qa('input').forEach(i=>{if(i.type==='text'&&/name|display/i.test((i.name||'')+(i.id||'')+(i.placeholder||'')))i.autocomplete='name'});
}
function unlockStuck(){const f=authArea();if(!f)return;const b=f.querySelector('button[type="submit"],input[type="submit"]');if(!b)return;const err=f.querySelector('.error,.danger,.alert,[role="alert"]');if(err&&b.disabled){b.disabled=false;b.dataset.kf64Busy='0';const original=b.dataset.kf64Text;if(original){if(b.tagName==='INPUT')b.value=original;else b.textContent=original}}}
const css=document.createElement('style');css.textContent=`.kf66FieldMsg{margin:6px 2px 0;font-size:12px;line-height:1.3;color:#aaa5b0}.kf66FieldMsg[data-kind="error"]{color:#ff9fba}.kf66FieldMsg[hidden]{display:none!important}@media(max-width:760px){#authForm input,.kf59Auth input,.auth form input{min-height:48px!important;font-size:16px!important}#authForm button[type="submit"],.kf59Auth button[type="submit"],.auth form button[type="submit"]{min-height:48px!important;font-size:16px!important}}`;document.head.appendChild(css);
let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{harden();unlockStuck()},60)}).observe(document.documentElement,{subtree:true,childList:true});
setTimeout(harden,0);setTimeout(harden,700);setInterval(unlockStuck,1200);
})();

;

;
(function(){const BUILD='phase67-release-shell';window.__KIN_FOLK_RELEASE__={build:BUILD,base:'phase62',layers:[63,64,65,66,67],loadedAt:new Date().toISOString()};document.documentElement.dataset.kinfolkBuild=BUILD;function mark(){const ok=!!document.querySelector('#authForm,.kf59Auth,.app,.shell,nav,.bottomNav');document.documentElement.dataset.kinfolkBoot=ok?'ready':'waiting';if(ok&&document.getElementById('kf67BootNotice'))document.getElementById('kf67BootNotice').remove()}function notice(){if(document.documentElement.dataset.kinfolkBoot==='ready'||document.getElementById('kf67BootNotice'))return;const d=document.createElement('div');d.id='kf67BootNotice';d.innerHTML='<strong>Kinfolk is still starting.</strong><span> If this lasts more than a few seconds, refresh the preview.</span><button type="button">Refresh</button>';d.querySelector('button').onclick=()=>location.reload();document.body.appendChild(d)}const css=document.createElement('style');css.textContent='#kf67BootNotice{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:100002;display:flex;align-items:center;gap:8px;max-width:min(92vw,620px);padding:10px 12px;border-radius:14px;background:#251d28;color:#fff;box-shadow:0 10px 30px #0008;font-size:13px}#kf67BootNotice span{color:#d7d0dc}#kf67BootNotice button{margin-left:auto;border:0;border-radius:10px;padding:7px 10px;font-weight:800}@media(max-width:760px){#kf67BootNotice{top:calc(8px + env(safe-area-inset-top,0px));align-items:flex-start;flex-wrap:wrap}#kf67BootNotice button{margin-left:0}}';document.head.appendChild(css);let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(mark,80)}).observe(document.documentElement,{subtree:true,childList:true});setTimeout(mark,250);setTimeout(mark,1200);setTimeout(()=>{mark();notice()},10000);})();
;

;
(function(){const BUILD='phase68-release-consolidation';window.__KIN_FOLK_RELEASE__={build:BUILD,base:'phase60',layers:[61,62,63,64,65,66,67,68],loadedAt:new Date().toISOString()};document.documentElement.dataset.kinfolkBuild=BUILD;function ready(){const ok=!!document.querySelector('#authForm,.kf59Auth,.app,.shell,nav,.bottomNav');document.documentElement.dataset.kinfolkBoot=ok?'ready':'waiting';return ok}function audit(){const problems=[];if(!document.querySelector('meta[name="viewport"]'))problems.push('viewport');if(document.body.scrollWidth>window.innerWidth+3)problems.push('horizontal-overflow');if(!navigator.onLine)problems.push('offline');document.documentElement.dataset.kinfolkHealth=problems.length?'warn':'ok';window.__KIN_FOLK_HEALTH__={build:BUILD,problems,view:(()=>{try{return state?.view||'unknown'}catch{return'unknown'}})(),size:{w:innerWidth,h:innerHeight},time:new Date().toISOString()}}function tick(){ready();audit()}addEventListener('resize',()=>setTimeout(tick,80));addEventListener('online',tick);addEventListener('offline',tick);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')tick()});let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(tick,100)}).observe(document.documentElement,{subtree:true,childList:true});setTimeout(tick,300);setTimeout(tick,1500);setInterval(audit,5000)})();
;

;
(function(){
  const BUILD='phase69-release-candidate';
  window.__KIN_FOLK_RELEASE__={build:BUILD,base:'phase58',layers:[59,60,61,62,63,64,65,66,67,68,69],loadedAt:new Date().toISOString()};
  document.documentElement.dataset.kinfolkBuild=BUILD;

  const qs=(s,r=document)=>r.querySelector(s);
  const has=(s)=>!!qs(s);
  function currentView(){try{return String(state?.view||'unknown')}catch{return'unknown'}}
  function signedIn(){try{return !!state?.user}catch{return document.documentElement.dataset.kf65Session==='active'}}

  function checks(){
    const auth=has('#authForm,.kf59Auth,form[data-auth],.auth form');
    const app=has('.app,.shell,#app nav,.bottomNav,nav');
    const profile=has('.profileHero,.profileTabs,.kf55Actions');
    const feed=has('[data-post-id],.post,.feed,.composer,textarea');
    const messages=has('[class*=message i],[class*=conversation i]');
    const notifications=has('[class*=notification i]');
    const media=has('input[type=file],video,img');
    const bottomNav=has('.bottomNav,[class*=bottomnav i],nav');
    const overflow=document.body?document.body.scrollWidth>innerWidth+3:false;
    return {
      build:BUILD,
      online:navigator.onLine,
      signedIn:signedIn(),
      authVisible:auth,
      appVisible:app,
      profileSurface:profile,
      feedSurface:feed,
      messagingSurface:messages,
      notificationSurface:notifications,
      mediaSurface:media,
      navigationSurface:bottomNav,
      horizontalOverflow:overflow,
      view:currentView(),
      viewport:{width:innerWidth,height:innerHeight,touch:('ontouchstart'in window)||navigator.maxTouchPoints>0},
      time:new Date().toISOString()
    };
  }

  function mark(){
    const c=checks();
    window.__KIN_FOLK_CHECKS__=c;
    document.documentElement.dataset.kinfolkBoot=(c.authVisible||c.appVisible)?'ready':'waiting';
    document.documentElement.dataset.kinfolkHealth=(!c.online||c.horizontalOverflow)?'warn':'ok';
    return c;
  }

  function panel(){
    if(!new URLSearchParams(location.search).has('kinfolk_check')) return;
    let p=qs('#kf69Check');
    if(!p){
      p=document.createElement('aside');
      p.id='kf69Check';
      p.innerHTML='<div class="kf69Head"><strong>Kinfolk launch check</strong><button type="button" data-close>×</button></div><pre></pre><button type="button" data-refresh>Refresh check</button>';
      p.querySelector('[data-close]').onclick=()=>p.remove();
      p.querySelector('[data-refresh]').onclick=()=>{mark();renderPanel()};
      document.body.appendChild(p);
    }
    renderPanel();
  }

  function renderPanel(){
    const p=qs('#kf69Check'); if(!p) return;
    p.querySelector('pre').textContent=JSON.stringify(mark(),null,2);
  }

  const css=document.createElement('style');
  css.textContent=`#kf69Check{position:fixed;right:10px;bottom:88px;z-index:100010;width:min(90vw,360px);max-height:68vh;overflow:auto;background:#121218f2;color:#fff;border:1px solid #4a4450;border-radius:16px;padding:12px;box-shadow:0 18px 50px #000b;font:12px/1.4 system-ui}#kf69Check .kf69Head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}#kf69Check pre{white-space:pre-wrap;word-break:break-word;margin:0 0 10px;color:#d8d3df}#kf69Check button{border:0;border-radius:10px;padding:8px 10px;background:var(--accent,#e85a9b);color:white;font-weight:800}#kf69Check [data-close]{background:#343039;font-size:16px;line-height:1}`;
  document.head.appendChild(css);

  let timer;
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{mark();panel()},100)}).observe(document.documentElement,{subtree:true,childList:true});
  addEventListener('resize',()=>setTimeout(()=>{mark();panel()},100));
  addEventListener('online',()=>{mark();panel()});
  addEventListener('offline',()=>{mark();panel()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){mark();panel()}});
  setTimeout(()=>{mark();panel()},250);
  setTimeout(()=>{mark();panel()},1500);
  setInterval(mark,5000);
})();
;

;
(function(){
  const STYLE_ID='kf73-auth-style';
  if(!document.getElementById(STYLE_ID)){
    const css=document.createElement('style');
    css.id=STYLE_ID;
    css.textContent=`
      body.kf73Auth #app{min-height:100dvh;background:radial-gradient(circle at 50% -10%,rgba(232,90,155,.22),transparent 34%),linear-gradient(180deg,#17151c,#0f0f14 72%)}
      .kf73Shell{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:28px 18px 40px;box-sizing:border-box}.kf73Card{width:min(100%,460px)}
      .kf73Brand{text-align:center;margin:6px 0 26px}.kf73Logo{font-size:42px;line-height:1;font-weight:1000;letter-spacing:-2px;color:var(--accent,#e85a9b)}.kf73Tag{color:#b7b5c0;margin-top:9px;font-size:15px}
      .kf73Tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#22212a;border:1px solid rgba(255,255,255,.07);padding:5px;border-radius:18px;margin-bottom:16px}.kf73Tabs button{border:0;border-radius:14px;padding:12px 10px;background:transparent;color:#aaa8b3;font:inherit;font-weight:850;min-height:48px}.kf73Tabs button.active{background:var(--accent,#e85a9b);color:#fff;box-shadow:0 8px 22px rgba(0,0,0,.22)}
      .kf73Form{background:#1c1b22;border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:20px;box-shadow:0 18px 50px rgba(0,0,0,.28)}
      .kf73Title{font-weight:950;font-size:23px;margin:0 0 6px}.kf73Text{color:#aaa8b3;font-size:14px;line-height:1.45;margin-bottom:18px}.kf73Form label{display:block;font-weight:800;color:#d7d4df;margin:13px 0 7px}.kf73Form input[type=email],.kf73Form input[type=password],.kf73Form input[type=text]{width:100%;box-sizing:border-box;min-height:54px;border-radius:15px;border:1px solid rgba(255,255,255,.12);background:#121118;color:#fff;padding:0 16px;font:inherit;font-size:16px;outline:none}.kf73Form input:focus{border-color:var(--accent,#e85a9b);box-shadow:0 0 0 3px rgba(232,90,155,.12)}
      .kf73Password{position:relative}.kf73Password input{padding-right:74px!important}.kf73Show{position:absolute;right:9px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:var(--accent,#e85a9b);font:inherit;font-weight:900;padding:9px}
      .kf73Meta{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:13px 2px 2px;color:#c7c5cf;font-size:14px}.kf73Meta label{display:flex;align-items:center;gap:9px;margin:0;font-weight:600}.kf73Meta input{width:19px;height:19px;min-height:0;accent-color:var(--accent,#e85a9b)}.kf73Forgot{border:0;background:none;color:var(--accent,#e85a9b);font:inherit;font-weight:850;padding:6px 0}
      .kf73Primary{width:100%;min-height:53px;border:0;border-radius:15px;background:var(--accent,#e85a9b);color:#fff;font:inherit;font-size:17px;font-weight:950;margin-top:18px}.kf73Primary:disabled{opacity:.65}.kf73Divider{display:flex;align-items:center;gap:10px;color:#74727d;font-size:12px;margin:19px 0}.kf73Divider:before,.kf73Divider:after{content:'';height:1px;flex:1;background:rgba(255,255,255,.08)}.kf73Switch{width:100%;min-height:50px;border:1px solid var(--accent,#e85a9b);border-radius:14px;background:transparent;color:var(--accent,#e85a9b);font:inherit;font-weight:900}.kf73Help{text-align:center;color:#84828d;font-size:12px;line-height:1.45;margin:15px 10px 0}.kf73Msg{display:none;margin:12px 0 0;padding:10px 12px;border-radius:12px;background:#321d28;color:#ffd9e7;font-size:13px}
      .kf73Steps{display:flex;gap:6px;margin-bottom:15px}.kf73Steps i{height:5px;flex:1;border-radius:99px;background:#34333d}.kf73Steps i.on{background:var(--accent,#e85a9b)}
      @media(max-width:520px){.kf73Shell{align-items:flex-start;padding-top:30px}.kf73Logo{font-size:38px}.kf73Form{padding:18px}.kf73Card{width:100%}}
    `;
    document.head.appendChild(css);
  }

  let mode='login';
  const savedStay=()=>{try{return localStorage.getItem('kinfolk_stay_logged_in_v1')!=='0'}catch{return true}};
  const saveStay=v=>{try{localStorage.setItem('kinfolk_stay_logged_in_v1',v?'1':'0');localStorage.setItem('kinfolk_stay_logged_in',v?'1':'0')}catch{}};
  const msg=(form,text,good=false)=>{const box=form.querySelector('.kf73Msg');box.style.display='block';box.style.color=good?'#c9ffd9':'#ffd9e7';box.textContent=text};

  function shell(){
    const app=document.getElementById('app');
    if(!app)return null;
    let root=app.querySelector('.kf73Shell');
    if(root)return root;
    app.innerHTML=`<div class="kf73Shell"><div class="kf73Card"><div class="kf73Brand"><div class="kf73Logo">Kinfolk</div><div class="kf73Tag">Your people. Your profile. Your space.</div></div><div class="kf73Tabs"><button type="button" data-kf73-mode="login">Log in</button><button type="button" data-kf73-mode="signup">Create account</button></div><form id="authForm" class="kf73Form" data-kf73="1"></form></div></div>`;
    document.body.classList.add('kf73Auth');
    root=app.querySelector('.kf73Shell');
    root.querySelectorAll('[data-kf73-mode]').forEach(b=>b.onclick=()=>render(b.dataset.kf73Mode));
    return root;
  }

  function commonStay(form){
    const cb=form.querySelector('#kf73Stay');
    if(cb){cb.checked=savedStay();/* Commit Stay Logged In only after accepted auth, not on checkbox toggle. */}
  }

  function wirePassword(form){
    const p=form.querySelector('input[type=password]');
    const b=form.querySelector('.kf73Show');
    if(p&&b)b.onclick=()=>{const show=p.type==='password';p.type=show?'text':'password';b.textContent=show?'Hide':'Show'};
  }

  // Recovery143: native Capacitor WebViews use a nonpublic https://localhost origin.
  // Never send that origin as a recovery email callback. Until a verified HTTPS
  // recovery link is allowlisted, let Supabase use its configured Site URL.
  function passwordResetRedirectOptions(){
    const configured=window.KINFOLK_PASSWORD_RESET_REDIRECT_URL;
    try{
      const target=new URL(configured||location.origin);
      const host=target.hostname.toLowerCase();
      if(target.protocol!=='https:'||host==='localhost'||host.endsWith('.localhost')||['127.0.0.1','0.0.0.0','[::1]'].includes(host))return {};
      return {redirectTo:configured?target.href:target.origin};
    }catch{return {}}
  }

  function render(next='login'){
    mode=next==='signup'?'signup':'login';
    const root=shell();if(!root)return;
    const form=root.querySelector('#authForm');
    root.querySelectorAll('[data-kf73-mode]').forEach(b=>b.classList.toggle('active',b.dataset.kf73Mode===mode));
    if(mode==='login'){
      form.innerHTML=`<div class="kf73Title">Welcome back</div><div class="kf73Text">Log in to Kinfolk with the email and password already connected to your account.</div><label for="kf73Email">Email</label><input id="kf73Email" type="email" required autocomplete="email" inputmode="email" placeholder="Email address"><label for="kf73Password">Password</label><div class="kf73Password"><input id="kf73Password" type="password" required autocomplete="current-password" placeholder="Password"><button class="kf73Show" type="button">Show</button></div><div class="kf73Meta"><label><input id="kf73Stay" type="checkbox"> Stay logged in</label><button type="button" class="kf73Forgot">Forgot password?</button></div><button type="submit" class="kf73Primary">Log in</button><div class="kf73Divider">or</div><button type="button" class="kf73Switch">Need an account? Join Kinfolk</button><div class="kf73Msg"></div><div class="kf73Help">Use the same email and password you used when you created your account.</div>`;
      form.querySelector('.kf73Switch').onclick=()=>render('signup');
      const forgot=form.querySelector('.kf73Forgot');forgot.onclick=async()=>{if(forgot.disabled)return;const email=form.querySelector('#kf73Email').value.trim();if(!email){msg(form,'Enter your email first.');form.querySelector('#kf73Email').focus();return}forgot.disabled=true;try{const {error}=await sb.auth.resetPasswordForEmail(email,passwordResetRedirectOptions());if(error)throw error;msg(form,'Password reset email sent.',true)}catch(e){msg(form,e.message||'Could not send reset email.')}finally{forgot.disabled=false}};
    }else{
      form.innerHTML=`<div class="kf73Steps"><i class="on"></i><i class="on"></i><i></i></div><div class="kf73Title">Create your Kinfolk</div><div class="kf73Text">Start with your display name, email and a new password. You can finish customizing your profile after signup.</div><label for="kf73Name">Display name</label><input id="kf73Name" type="text" required maxlength="40" autocomplete="name" placeholder="Your display name"><label for="kf73Email">Email</label><input id="kf73Email" type="email" required autocomplete="email" inputmode="email" placeholder="Email address"><label for="kf73Password">New password</label><div class="kf73Password"><input id="kf73Password" type="password" required minlength="12" maxlength="128" autocomplete="new-password" placeholder="Create a password (12–128 characters)"><button class="kf73Show" type="button">Show</button></div><div class="kf73Meta"><label><input id="kf73Stay" type="checkbox"> Stay logged in</label></div><button type="submit" class="kf73Primary">Create account</button><div class="kf73Divider">or</div><button type="button" class="kf73Switch">Already have an account? Log in</button><div class="kf73Msg"></div><div class="kf73Help">By creating an account, you agree to Kinfolk’s community rules and privacy terms.</div>`;
      form.querySelector('.kf73Switch').onclick=()=>render('login');
    }
    commonStay(form);wirePassword(form);
    form.onsubmit=async e=>{
      e.preventDefault();
      const btn=form.querySelector('.kf73Primary');btn.disabled=true;
      const email=form.querySelector('#kf73Email').value.trim();
      const password=form.querySelector('#kf73Password').value;
      saveStay(form.querySelector('#kf73Stay')?.checked!==false);
      try{
        if(mode==='signup'&&(password.length<12||password.length>128))throw new Error('Password must be 12–128 characters.');
        if(mode==='login'){
          const {error}=await sb.auth.signInWithPassword({email,password});
          if(error)throw error;
          msg(form,'Logged in. Opening Kinfolk…',true);
        }else{
          const display_name=form.querySelector('#kf73Name').value.trim();
          const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin,data:{display_name}}});
          if(error)throw error;
          if(data?.session)msg(form,'Account created. Opening Kinfolk…',true);else msg(form,'Account created. Check your email to confirm it, then log in.',true);
        }
      }catch(err){msg(form,err.message||String(err));btn.disabled=false}
    };
    window.__KIN_FOLK_PHASE73__={loaded:true,mode};
  }

  function mount(){
    const app=document.getElementById('app');
    if(!app)return;
    const baseAuth=app.querySelector('#authForm');
    if(baseAuth&&!app.querySelector('.kf73Shell'))render('login');
    if(!baseAuth&&!app.querySelector('.kf73Shell'))document.body.classList.remove('kf73Auth');
  }
  let timer;
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(mount,60)}).observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(mount,50);setTimeout(mount,600);
})();
;

;
(function(){
  const SUPABASE_URL='https://zojajuzmfjpvubzibzgg.supabase.co';
  const ANON_KEY='sb_publishable_1te_hrDXQciMD7Gp1EXmRw_dvQmszvi';
  const STORAGE_KEY='sb-zojajuzmfjpvubzibzgg-auth-token';
  function friendlyError(data,status){
    const raw=(data?.error_description||data?.msg||data?.message||data?.error||'').toString();
    const low=raw.toLowerCase();
    if(low.includes('invalid login')||low.includes('invalid credentials'))return'Email or password is incorrect.';
    if(low.includes('email not confirmed'))return'Your email still needs to be confirmed. Check your inbox, then try again.';
    if(low.includes('rate limit'))return'Too many attempts. Wait a moment, then try again.';
    if(!raw&&status>=500)return'Kinfolk login is temporarily unavailable. Try again in a moment.';
    return raw||'Could not log in. Please try again.';
  }
  async function authRequest(path,body){
    const r=await fetch(SUPABASE_URL+path,{method:'POST',headers:{'Content-Type':'application/json','apikey':ANON_KEY,'Authorization':'Bearer '+ANON_KEY},body:JSON.stringify(body),cache:'no-store'});
    let data={};
    try{data=await r.json()}catch(_){}
    if(!r.ok)throw Object.assign(new Error(friendlyError(data,r.status)),{status:r.status,data});
    return data;
  }
  function savePrefs(stay){
    localStorage.setItem('kinfolk_stay_logged_in_v1',stay?'1':'0');
    localStorage.setItem('kinfolk_stay_logged_in',stay?'1':'0');
    if(stay)sessionStorage.removeItem('kinfolk_session_tab');
    else sessionStorage.setItem('kinfolk_session_tab','1');
  }
  async function adoptSession(data,stay){
    if(!data?.access_token||!data?.refresh_token)throw new Error('Kinfolk received an incomplete login session. Please try again.');
    savePrefs(stay);
    if(typeof sb!=='undefined'&&sb?.auth?.setSession){
      const {data:sessionData,error}=await sb.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
      if(error)throw error;
      if(!sessionData?.session)throw new Error('Kinfolk could not activate your session. Please try again.');
      return sessionData.session;
    }
    const expiresAt=data.expires_at||Math.floor(Date.now()/1000)+(data.expires_in||3600);
    localStorage.setItem(STORAGE_KEY,JSON.stringify({...data,expires_at:expiresAt}));
    return data;
  }
  function showMessage(form,text,good=false){
    let box=form.querySelector('.kf73Msg');
    if(!box){box=document.createElement('div');box.className='kf73Msg';form.appendChild(box)}
    box.style.display='block';
    box.style.color=good?'#c9ffd9':'#ffd9e7';
    box.textContent=text;
  }
  async function finishOpen(form){
    const {data,error}=await sb.auth.getSession();
    if(error)throw error;
    if(!data?.session)throw new Error('Your session could not be restored. Please try again.');
    if(window.kf129ActivateSession)await window.kf129ActivateSession(data.session);
  }
  function wire(){
    const form=document.querySelector('#authForm[data-kf73="1"]');
    if(!form)return;
    const title=(form.querySelector('.kf73Title')?.textContent||'').trim().toLowerCase();
    const mode=title.includes('welcome back')?'login':title.includes('create your kinfolk')?'signup':null;
    if(!mode||mode==='signup')return; // Recovery129: Phase79 owns signup and enforces the 13+ birthdate gate.
    const signature=mode+':75';
    if(form.dataset.kf75===signature)return;
    form.dataset.kf75=signature;
    form.onsubmit=async e=>{
      e.preventDefault();
      e.stopPropagation();
      const btn=form.querySelector('.kf73Primary');
      const email=form.querySelector('#kf73Email')?.value.trim()||'';
      const password=form.querySelector('#kf73Password')?.value||'';
      const stay=form.querySelector('#kf73Stay')?.checked!==false;
      if(!email){showMessage(form,'Enter your email address.');form.querySelector('#kf73Email')?.focus();return}
      if(mode==='signup'&&(password.length<12||password.length>128)){showMessage(form,'Password must be 12–128 characters.');form.querySelector('#kf73Password')?.focus();return}
      if(btn){btn.disabled=true;btn.textContent=mode==='login'?'Logging in…':'Creating account…'}
      try{
        if(mode==='login'){
          const data=await authRequest('/auth/v1/token?grant_type=password',{email,password});
          await adoptSession(data,stay);
          showMessage(form,'Logged in. Opening Kinfolk…',true);
          await finishOpen(form);
        }else{
          const display_name=form.querySelector('#kf73Name')?.value.trim()||'';
          if(!display_name)throw new Error('Enter a display name.');
          const data=await authRequest('/auth/v1/signup?redirect_to='+encodeURIComponent(location.origin),{email,password,data:{display_name}});
          if(data?.access_token&&data?.refresh_token){
            await adoptSession(data,stay);
            showMessage(form,'Account created. Opening Kinfolk…',true);
            await finishOpen(form);
          }else{
            showMessage(form,'Account created. Check your email to confirm it, then log in.',true);
            if(btn){btn.disabled=false;btn.textContent='Create account'}
          }
        }
      }catch(err){
        showMessage(form,err.message||'Could not continue. Please try again.');
        if(btn){btn.disabled=false;btn.textContent=mode==='login'?'Log in':'Create account'}
      }
    };
    window.__KIN_FOLK_PHASE75__={loaded:true,mode};
  }

  const goldCss=document.createElement('style');
  goldCss.textContent='.kf75Gold{display:inline-flex;align-items:center;padding:0 3px;border:0;background:none;color:#f7c94b;font-weight:900;font-size:18px;margin-left:5px}.kf75Grant{border:0;border-radius:12px;padding:10px 13px;font-weight:900;background:#dca928;color:#17120a;margin:8px 0 0}.kf75Grant:disabled{opacity:.6}';
  document.head.appendChild(goldCss);
  async function goldStatus(uid){
    try{
      if(typeof sb==='undefined'||!sb?.rpc)return false;
      const {data,error}=await sb.rpc('has_gold_star',{target_user:uid});
      if(error)throw error;
      return data===true;
    }catch{return false}
  }
  async function mountGold(){
    try{
      const st=window.state;if(!st?.user||st.view!=='profile')return;
      const viewerId=st.user.id,uid=st.profileViewId||viewerId;
      const hero=document.querySelector('.profileHero');if(!hero)return;
      const current=()=>window.state?.user?.id===viewerId&&window.state.view==='profile'&&(window.state.profileViewId||viewerId)===uid&&document.querySelector('.profileHero')===hero;
      const gold=await goldStatus(uid);
      if(!current())return;
      // Read badges AFTER the async status lookup: concurrent polling must not add duplicates.
      const badges=[...hero.querySelectorAll('.kf75Gold')];
      let badge=badges.shift()||null;
      badges.forEach(extra=>extra.remove());
      if(gold){
        if(!badge){badge=document.createElement('span');badge.className='kf75Gold'}
        badge.textContent='★';
        badge.title='Gold Star';
        badge.setAttribute('aria-label','Gold Star subscriber');
        const name=hero.querySelector('h1,h2,.name,.profileName');
        if(badge.parentElement!==(name||hero))(name||hero).appendChild(badge);
      }else badge?.remove();
      const can=!!st.user.app_metadata?.can_grant_gold||st.user.app_metadata?.kinfolk_role==='owner';
      let btn=hero.parentElement?.querySelector('.kf75Grant');
      if(!can||uid===viewerId||gold){btn?.remove();return}
      if(!btn){
        btn=document.createElement('button');btn.type='button';btn.className='kf75Grant';btn.textContent='★ Give Gold Star';
        btn.onclick=async()=>{
          if(btn.disabled||!current())return;
          btn.disabled=true;
          try{
            const {error}=await sb.rpc('grant_gold_star',{target_user:uid,grant_note:'Free Gold Star awarded in Kinfolk'});
            if(error)throw error;
            if(!current())return;
            window.toast?.('Gold Star granted.','good');btn.remove();mountGold();
          }catch(error){
            if(current())window.toast?.(error?.message||'Could not grant Gold Star.','danger');
          }finally{btn.disabled=false}
        };
        (hero.parentElement||hero).appendChild(btn);
      }
    }catch(e){console.warn('Kinfolk Gold Star mount',e)}
  }

  let timer;
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{wire();mountGold()},45)}).observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(()=>{wire();mountGold()},40);setTimeout(()=>{wire();mountGold()},450);
  setInterval(()=>{if(document.visibilityState==='visible'){wire();mountGold()}},1200);
})();
;
