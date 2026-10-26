# Recovery247 | real isolated native backend configuration

- Verified isolated Supabase project `viantpfagtbgyyzavmtv` ACTIVE_HEALTHY and canonical URL `https://viantpfagtbgyyzavmtv.supabase.co`.
- Retrieved enabled modern publishable key using Supabase connector. Never use legacy anon JWT, secret key or live project.
- Native packaging already supports `KINFOLK_ALPHA_SUPABASE_URL` and `KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY`; no application rewrite required.
- To produce a **functional** isolated native alpha, supply these variables as local build secrets or CI secrets. Example (replace placeholder with the project publishable key fetched from Supabase):
```sh
export KINFOLK_ALPHA_SUPABASE_URL=https://viantpfagtbgyyzavmtv.supabase.co
export KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY='<isolated project publishable key>'
cd kinfolk-social/native
npm ci
npm run sync
npm run alpha:verify
```
- The key is public-client-safe but do not store it in this public repository's source or notes. Never use service-role credentials in app assets.
- Only blocks and kinfolk_reports are currently implemented in isolated backend. Existing main app references additional tables and RPCs. **Do not claim real signup/feed/upload functionality yet**.
- Real email verification, RLS from two signed-in users, Android/iOS signed builds and physical QA not verified.
- Shared live Supabase, production, and Kinfolksworld unchanged.
