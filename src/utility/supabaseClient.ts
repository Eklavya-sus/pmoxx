import { createClient } from "@refinedev/supabase";

const SUPABASE_URL = "https://ldlhqnqsyrgugfmpgbmm.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkbGhxbnFzeXJndWdmbXBnYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTE5MTAwOTksImV4cCI6MjAyNzQ4NjA5OX0.jlqyoq-D_7UvMjDmIn6QWSFQH3nP-hlQBHTMoJpvWT8";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: {
    schema: "public", // this can be overridden by passing `meta.schema` to data hooks.
  },
  auth: {
    persistSession: true,
  },
});