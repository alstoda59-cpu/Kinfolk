// Bridge required by the existing Kinfolk inline application code.
// Keep the same window.supabase.createClient shape used by its web preview.
import { createClient } from '@supabase/supabase-js';
window.supabase={createClient};
