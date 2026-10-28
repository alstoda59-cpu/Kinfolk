// Behavioral regression for the actual Phase79 signup field identity guard.
// No network, user data or Supabase writes. Synthetic fixtures only.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase79.js'),'utf8');
const start=source.indexOf('  function signupInputsUnchanged(form,expected){');
const end=source.indexOf('\\n  async function handleSignup(e){',start);
assert.ok(start>=0&&end>start,'Phase79 signup identity guard must exist');
const unchanged=Function('return ('+source.slice(start,end).trim()+')')();
const baseline={display_name:'Synthetic Member',email:'synthetic@example.test',password:'correct_password_123',birthdate:'2009-10-01',username:'test_teen',confirmPassword:'correct_password_123',bio:'hello',preferredLanguage:'en',interests:['music','games'],gender:'',privateProfile:true,stay:true};
function form(values){
  const fields={'#kf73Name':'display_name','#kf73Email':'email','#kf73Password':'password','#kf79Birthdate':'birthdate','#kf217Username':'username','#kf217ConfirmPassword':'confirmPassword','#kf218Bio':'bio','#kf218Language':'preferredLanguage','#kf219Gender':'gender','#kf219Private':'privateProfile','#kf73Stay':'stay'};
  return {querySelector(selector){const key=fields[selector];return !key?null:key==='stay'||key==='privateProfile'?{checked:values[key]}:{value:values[key]};},querySelectorAll(){return values.interests.map(value=>({value}));}};
}
test('unchanged signup identity is accepted',()=>assert.equal(unchanged(form(baseline),baseline),true));
for(const [field,changed] of Object.entries({email:'other@example.test',password:'changed_password_123',birthdate:'2000-01-01',stay:false,privateProfile:false,username:'different_teen',display_name:'Different Member',preferredLanguage:'fr',interests:['music']})){
  test('signup identity rejects changed '+field,()=>assert.equal(unchanged(form({...baseline,[field]:changed}),baseline),false));
}
test('guard is checked after signup response and after asynchronous session verification',()=>{
  assert.equal(source.split('!signupInputsUnchanged(form,signupSnapshot)').length-1,2);
  assert.ok(source.indexOf('const result=await Promise.race(')<source.indexOf('!signupInputsUnchanged(form,signupSnapshot)'));
  assert.ok(source.lastIndexOf('!signupInputsUnchanged(form,signupSnapshot)')>source.indexOf('const verifiedSignupSession=await signupSessionIsCurrent(data.session)'));
});
