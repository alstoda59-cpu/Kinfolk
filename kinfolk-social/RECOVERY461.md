# Recovery461 | Post deletion account isolation

2026-11-04. Continued from Recovery460 final commit b2dbecc686c8e6f76a45d3d3e236b7299c73b062 on isolated branch `kinfolk-social/recovery461-delete-post-isolation-20261104`. No Kinfolksworld or production changes.

The Home feed delete-post handler now captures account ID and authentication epoch, scopes deletion to both post ID and author ID, requires an exact one-row Supabase acknowledgment, prevents simultaneous duplicate requests, and suppresses stale response UI updates after an account change. Unknown outcomes lock further deletion attempts for the account/post until reload; generic errors avoid leaking backend details.

Application commit 70bb5ccad106e2993a52f707d3933247e264ecff. Synthetic regression commits 74ce67a83f44403ee9a96cdd64d91bc4070363ff and 1d4d2d1394e854e13ad6e951ba3910ccce52fffd. Test command: `node kinfolk-social/tests/recovery461-delete-post-isolation.test.cjs`. Six scenarios added; execution not independently verified, no passing result claimed.

Recovery460 final documentation deployment dpl_3QSMaqzfVV1fGpU8HcYj5vEvmheU confirmed READY before editing. Recovery461 deployment/CI require separate verification. Real isolated Supabase authentication/RLS, uploads, native builds and device QA remain blocked/unverified. Isolated Supabase organization and any nonzero cost need owner approval. No shared live schema/auth/data/security, production aliases, Kinfolksworld or stores changed. Not launch-ready.
