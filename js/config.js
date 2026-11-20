// ============================================================================
// CONFIGURAÇÃO DO SUPABASE (CHAVE PÚBLICA ANON - SEGURA COM RLS)
// ============================================================================
// Pegue esses dois dados no Supabase em: Project Settings > API

const SUPABASE_URL = "https://wetgwplwamwjwqptqfks.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldGd3cGx3YW13andxcHRxZmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNjgyNzAsImV4cCI6MjExMDc0NDI3MH0.pYL6_chLSPKdeyspP0VllHvixERsyFOgSXEeQa8BcWg";

// Validação rápida para evitar erro silencioso caso esqueça de preencher
if (
  !SUPABASE_URL.startsWith("https://wetgwplwamwjwqptqfks.supabase.co") ||
  SUPABASE_ANON_KEY === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldGd3cGx3YW13andxcHRxZmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNjgyNzAsImV4cCI6MjExMDc0NDI3MH0.pYL6_chLSPKdeyspP0VllHvixERsyFOgSXEeQa8BcWg"
) {
  console.warn("⚠️ Atenção: Configure SUPABASE_URL e SUPABASE_ANON_KEY em js/config.js");
}

// Inicializa o cliente Supabase global (carregado via CDN nas páginas HTML)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
