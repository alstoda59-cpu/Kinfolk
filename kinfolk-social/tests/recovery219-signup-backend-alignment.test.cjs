const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const app=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase79.js'),'utf8');
const draft=fs.readFileSync(path.join(__dirname,'..','migrations','DRAFT_recovery219_signup_integrity.sql'),'utf8');

test('signup sends the exact profile metadata keys read by current DB triggers',()=>{
  const handler=app.slice(app.indexOf('async function handleSignup'));
  assert.match(handler,/profile_display_name:display_name/);
  assert.match(handler,/profile_bio:bio/);
  assert.match(handler,/signup_birthdate:birthdate/);
  assert.match(handler,/preferred_language:preferredLanguage/);
});

test('duplicate username feedback does not change signup or login ownership',()=>{
  assert.match(app,/username.*already taken/i);
  assert.match(app,/document\.addEventListener\('submit',handleSignup,true\)/);
  assert.match(app,/if\(!title\.includes\('create your kinfolk'\)\) return/);
});

test('migration is a draft, not a deployed migration, and preserves age gate',()=>{
  assert.match(draft,/DRAFT ONLY/);
  assert.match(draft,/DO NOT APPLY/);
  assert.match(draft,/profiles_username_casefold_unique_idx/);
  assert.match(draft,/RAISE EXCEPTION 'Username is already taken'/);
  assert.match(draft,/IF age_years < 13 OR age_years > 99/);
  assert.match(draft,/kinfolk_safety_settings/);
  assert.match(draft,/kinfolk_user_preferences/);
  assert.equal((draft.match(/COMMIT;/g)||[]).length,1);
  assert.equal((draft.match(/RETURN new;/g)||[]).length,1);
  assert.match(draft,/raw_birth !~ '\^\[0-9\]\{4\}/);
});
