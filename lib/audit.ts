import { SupabaseClient } from "@supabase/supabase-js";

/**
 * AtomQuest Goal Portal – Centralized Audit Logging Utility
 */

export async function logAudit(params: {
  supabase: SupabaseClient;
  userId: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
}) {
  const { supabase, userId, action, tableName, recordId, oldValue, newValue } = params;

  const { error } = await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    table_name: tableName,
    record_id: recordId || null,
    old_value: oldValue || null,
    new_value: newValue || null,
  });

  if (error) {
    console.error("Failed to write audit log:", error);
  }
}
