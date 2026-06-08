import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function callEdge<T = any>(
  fnName: string,
  body?: Record<string, any>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(fnName, body ? { body } : {});
  if (error) throw new Error(error.message);
  return data as T;
}
