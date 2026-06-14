import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ fullName: z.string().trim().max(120).optional(), phone: z.string().trim().max(40).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin
      .from("profiles")
      .upsert(
        { user_id: userId, full_name: data.fullName ?? null, phone: data.phone ?? null },
        { onConflict: "user_id" },
      );

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    // Bootstrap: only the very first registered account becomes admin.
    // Subsequent admin grants must be made by an existing admin.
    if ((count ?? 0) === 0) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    }
    return { ok: true };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const { data: isAdmin } = await supabase.rpc("is_admin");
    return {
      profile: profile ?? null,
      roles: (roles ?? []).map((r) => r.role),
      isAdmin: Boolean(isAdmin),
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ fullName: z.string().trim().max(120), phone: z.string().trim().max(40) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });