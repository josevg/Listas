// ============================================================================
// CONFIGURAÇÃO DO SUPABASE (CHAVE PÚBLICA ANON - SEGURA COM RLS)
// ============================================================================

const SUPABASE_URL = "https://wetgwplwamwjwqptqfks.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldGd3cGx3YW13andxcHRxZmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNjgyNzAsImV4cCI6MjExMDc0NDI3MH0.pYL6_chLSPKdeyspP0VllHvixERsyFOgSXEeQa8BcWg";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("COLE_SUA_CHAVE")) {
  console.warn("⚠️ Atenção: Verifique SUPABASE_URL e SUPABASE_ANON_KEY em js/config.js");
}

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  throw new Error("SDK do Supabase não carregado. Verifique a tag <script> do CDN no HTML.");
}

// Inicializa o cliente Supabase global (evita redeclaração se carregado mais de uma vez)
var supabaseClient = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;