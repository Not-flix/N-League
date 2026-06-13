import { fileStore } from "./file-store";
import { supabaseStore } from "./supabase-store";
import type { DataStore } from "./types";

let cached: DataStore | null = null;

export function getStore(): DataStore {
  if (cached) return cached;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    cached = supabaseStore;
  } else {
    cached = fileStore;
  }
  return cached;
}
