/**
 * 🗄️ Supabase Admin Wrapper (TS → JS)
 * Barber Analytics Pro - v2.0.0
 *
 * @description Wrapper para importar supabaseAdmin.ts como .js
 * @author Andrey Viana
 * @created 2025-11-13
 */

// Importar versão TypeScript
const { supabaseAdmin, getSupabaseAdmin } = await import('./supabaseAdmin.ts');

export { supabaseAdmin, getSupabaseAdmin };
