import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../db';
import type { AuditLogRow } from '../types';

export async function recentAudit(limit = 10, sb?: SupabaseClient) {
  const supabase = sb ?? getSupabase();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: (data ?? []) as AuditLogRow[], error };
}

export async function logAction(action: string, target: string, user_name = 'Admin', icon = 'activity') {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      id: `log-${Date.now()}`,
      action,
      user_name,
      target,
      icon,
    })
    .select('*')
    .single();
  return { data: data as AuditLogRow | null, error };
}
