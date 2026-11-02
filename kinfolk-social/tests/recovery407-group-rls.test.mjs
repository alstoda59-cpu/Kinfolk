import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Static contracts only. Real authenticated two-account RLS and device tests
// remain mandatory; SQL shape checks are not a substitute for those tests.
const sql=readFileSync(new URL('../migrations/ALPHA_only_group_chats_rls.sql',import.meta.url),'utf8');
const policy=(name,table,cmd)=>new RegExp('create policy '+name+' on public\\.'+table+'\\s+for '+cmd+' to authenticated');
test('Recovery407 migration targets isolated alpha only, not live Auth',()=>{
 assert.match(sql,/viantpfagtbgyyzavmtv/);
 assert.match(sql,/NEVER apply to shared\\/live zojajuzmfjpvubzibzgg/);
 assert.doesNotMatch(sql,/\\bdrop\\s+(?:table|schema|policy)\\b/i);
 assert.doesNotMatch(sql,/\\b(?:insert|update|delete|alter)\\s+(?:into\\s+|from\\s+)?auth\\.users\\b/i);
});
test('three group tables have RLS, UUID relationships and bounded text',()=>{
 for(const name of ['group_conversations','group_members','group_messages']){
   assert.match(sql,new RegExp('create table public\\.'+name+' \\('));
   assert.match(sql,new RegExp('alter table public\\.'+name+' enable row level security'));
 }
 assert.match(sql,/references public\\.group_conversations\\(id\\) on delete cascade/);
 assert.match(sql,/references public\\.profiles\\(id\\) on delete cascade/);
 assert.match(sql,/primary key \\(conversation_id,user_id\\)/);
 assert.match(sql,/char_length\\(btrim\\(title\\)\\) between 1 and 80/);
 assert.match(sql,/char_length\\(btrim\\(body\\)\\) between 1 and 2000/);
});
test('no anonymous group access and only narrow authenticated grants',()=>{
 assert.match(sql,/revoke all on public\\.group_conversations,public\\.group_members,public\\.group_messages\\s+from public,anon,authenticated/);
 assert.match(sql,/grant update\\(title\\) on public\\.group_conversations to authenticated/);
 assert.doesNotMatch(sql,/grant\\s+[^;]+\\s+to anon\\s*;/i);
 assert.doesNotMatch(sql,/grant update\\s+on public\\.group_members/i);
});
test('owner and member read helpers use JWT identity, not caller identity parameters',()=>{
 assert.match(sql,/create function kinfolk_alpha_private\\.alpha_group_access\\(group_id uuid\\)/);
 assert.match(sql,/security definer set search_path = ''/);
 assert.match(sql,/gm\\.user_id=\\(select auth\\.uid\\(\\)\\)/);
 assert.match(sql,/g\\.owner_id=\\(select auth\\.uid\\(\\)\\)/);
 assert.match(sql,/kinfolk_alpha_private\\.not_blocked\\(g\\.owner_id\\)/);
 assert.match(sql,policy('alpha_group_conversation_read','group_conversations','select'));
 assert.match(sql,/using \\(kinfolk_alpha_private\\.alpha_group_access\\(id\\)\\)/);
});
test('group creation and mutation belong to authenticated owner',()=>{
 assert.match(sql,policy('alpha_group_conversation_insert','group_conversations','insert'));
 assert.match(sql,/with check \\(owner_id=\\(select auth\\.uid\\(\\)\\)\\)/);
 assert.match(sql,policy('alpha_group_conversation_update','group_conversations','update'));
 assert.match(sql,policy('alpha_group_conversation_delete','group_conversations','delete'));
 assert.match(sql,/kinfolk_alpha_private\\.alpha_group_owner\\(id\\)/);
});
test('invitations are owner-only accepted friends, not arbitrary self-joins',()=>{
 assert.match(sql,/invitee<>\\(select auth\\.uid\\(\\)\\)/);
 assert.match(sql,/kinfolk_alpha_private\\.alpha_group_owner\\(group_id\\)/);
 assert.match(sql,/fr\\.status='accepted'/);
 assert.match(sql,/kinfolk_alpha_private\\.not_blocked\\(invitee\\)/);
 assert.match(sql,/ss\\.direct_messages<>'nobody'/);
 assert.match(sql,/us\\.allow_messages<>'nobody'/);
 assert.match(sql,policy('alpha_group_member_invite','group_members','insert'));
 assert.match(sql,/alpha_group_invite_allowed\\(conversation_id,user_id\\)/);
});
test('members may leave, only owners may remove others',()=>{
 assert.match(sql,policy('alpha_group_member_leave_or_remove','group_members','delete'));
 assert.match(sql,/user_id=\\(select auth\\.uid\\(\\)\\)\\s+or kinfolk_alpha_private\\.alpha_group_owner\\(conversation_id\\)/);
});
test('message reads and writes require membership and exact sender identity',()=>{
 assert.match(sql,policy('alpha_group_message_read','group_messages','select'));
 assert.match(sql,/alpha_group_access\\(conversation_id\\)\\s+and kinfolk_alpha_private\\.not_blocked\\(sender_id\\)/);
 assert.match(sql,policy('alpha_group_message_insert','group_messages','insert'));
 assert.match(sql,/sender_id=\\(select auth\\.uid\\(\\)\\)\\s+and kinfolk_alpha_private\\.alpha_group_access\\(conversation_id\\)/);
 assert.match(sql,policy('alpha_group_message_delete','group_messages','delete'));
});
