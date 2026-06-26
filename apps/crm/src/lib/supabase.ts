// Cliente Supabase do CRM.
// A anon key é PÚBLICA (feita pra rodar no browser) — quem protege o dado é a
// RLS + o JWT com account_id (custom access token hook). Ver supabase/migrations.
//
// ⚠️ Se rotacionar o JWT secret do Supabase, atualize esta anon key aqui
//    (e o secret SUPABASE_SERVICE_ROLE do Worker).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://plbzwswqkeozvyirzqma.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYnp3c3dxa2VvenZ5aXJ6cW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTU5MDYsImV4cCI6MjA5MTc5MTkwNn0.tHqFdqn74ncfHhDejdRf4_3RI6hln0E0nvIJQoGB8Dw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
