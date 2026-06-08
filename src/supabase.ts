import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function callEdge<T = any>(
  fnName: string,
  optionsOrBody?: any
): Promise<T> {
  // Se o fnName começa com "/", trata como sub-rota da function principal "claude_meta_ads"
  const targetFunction = fnName.startsWith("/")
    ? `claude_meta_ads${fnName}`
    : fnName;

  let invokeOptions: any = {};
  if (optionsOrBody) {
    const hasInvokeKeys = ["body", "headers", "method", "query"].some(key => key in optionsOrBody);
    if (hasInvokeKeys) {
      invokeOptions = optionsOrBody;
    } else {
      invokeOptions = { body: optionsOrBody };
    }
  }

  const { data, error } = await supabase.functions.invoke<T>(targetFunction, invokeOptions);
  if (error) throw new Error(error.message);
  return data as T;
}
