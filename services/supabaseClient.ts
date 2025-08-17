import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = supabaseUrl && supabaseKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// get recent history for context
export async function getRecentHistory(conversationId: string, limit = 5) {
  if (!supabase) {
    console.log("Supabase no configurado, usando memoria local");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("conversations_history")
      .select("user_prompt, ai_response, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.reverse() || [];
  } catch (error) {
    console.error("Error getting history:", error);
    return [];
  }
}
