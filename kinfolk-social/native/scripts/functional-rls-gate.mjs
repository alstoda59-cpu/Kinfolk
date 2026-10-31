// Mandatory read-only RLS evidence for a backend-connected functional alpha.
// A module import is not a test: this function must run with two actual synthetic
// account JWTs and owner fixtures in the designated isolated Supabase project.
import { verifyTwoUserRls, PRIVATE_TABLES } from './verify-two-user-rls.mjs';

export async function requireFunctionalRlsProof(config,{env=process.env,fetchImpl=globalThis.fetch}={}){
  if(env.KINFOLK_ALPHA_SYNTHETIC_ACCOUNTS_ONLY!=='1'){
    throw Error('Functional alpha requires explicit synthetic two-account RLS verification opt-in');
  }
  const result=await verifyTwoUserRls(config,{
    tokenA:env.KINFOLK_ALPHA_TEST_USER_A_JWT,
    tokenB:env.KINFOLK_ALPHA_TEST_USER_B_JWT,
    idA:env.KINFOLK_ALPHA_TEST_USER_A_ID,
    idB:env.KINFOLK_ALPHA_TEST_USER_B_ID,
    fetchImpl
  });
  if(result.projectRef!==config.projectRef||result.checkedTables!==PRIVATE_TABLES.length||result.readOnly!==true){
    throw Error('Functional alpha RLS proof is incomplete');
  }
  return result;
}
