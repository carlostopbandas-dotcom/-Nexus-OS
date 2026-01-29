
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfmfevpdcwcwatpkttnr.supabase.co';
const supabaseAnonKey = 'sb_publishable_BD0fsd916WaTIoCnLjT6pQ_tQozy6tz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
