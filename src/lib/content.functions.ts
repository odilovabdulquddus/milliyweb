import { createServerFn } from "@tanstack/react-start";

export const getPublicContent = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: about }, { data: sites }] = await Promise.all([
    supabaseAdmin.from("about_content").select("key,value"),
    supabaseAdmin.from("our_sites").select("*").order("sort_order", { ascending: true }),
  ]);
  const aboutMap: Record<string, string> = {};
  for (const row of about ?? []) aboutMap[row.key] = row.value ?? "";
  return { about: aboutMap, sites: sites ?? [] };
});