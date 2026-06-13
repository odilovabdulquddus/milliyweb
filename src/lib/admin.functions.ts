import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any }) {
  const { data: isAdmin } = await context.supabase.rpc("is_admin");
  if (!isAdmin) throw new Error("Ruxsat yo'q");
}

// ---------- Users ----------
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }, authList] = await Promise.all([
      supabaseAdmin.from("profiles").select("*"),
      supabaseAdmin.from("user_roles").select("user_id,role"),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    const emails: Record<string, string> = {};
    for (const u of authList.data?.users ?? []) emails[u.id] = u.email ?? "";
    const roleMap: Record<string, string[]> = {};
    for (const r of roles ?? []) (roleMap[r.user_id] ??= []).push(r.role);
    return {
      users: (profiles ?? []).map((p) => ({
        ...p,
        email: emails[p.user_id] ?? "",
        roles: roleMap[p.user_id] ?? [],
      })),
    };
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), fullName: z.string().max(120), phone: z.string().max(40) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").update({ full_name: data.fullName, phone: data.phone }).eq("user_id", data.userId);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.deleteUser(data.userId);
    return { ok: true };
  });

// ---------- Orders ----------
export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false });
    return { orders: data ?? [] };
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["Ishlab chiqilmoqda", "Yaratilmoqda", "Yaratildi"]).optional(),
        admin_notes: z.string().max(2000).optional(),
        admin_prompt: z.string().max(5000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.admin_notes !== undefined) patch.admin_notes = data.admin_notes;
    if (data.admin_prompt !== undefined) patch.admin_prompt = data.admin_prompt;
    const { data: order } = await supabaseAdmin.from("orders").update(patch as never).eq("id", data.id).select().single();
    if (data.status && order) {
      await supabaseAdmin.from("notifications").insert({
        user_id: order.user_id,
        order_id: order.id,
        title: "Buyurtma holati yangilandi",
        body: `"${order.site_name}" holati: ${data.status}`,
      });
    }
    return { ok: true };
  });

export const adminDeleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("orders").delete().eq("id", data.id);
    return { ok: true };
  });

// ---------- Our Sites ----------
export const adminUpsertSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().max(200).optional().default(""),
        url: z.string().min(1).max(2000),
        image_url: z.string().max(2000).optional().default(""),
        sort_order: z.number().int().optional().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = { title: data.title || null, url: data.url, image_url: data.image_url || null, sort_order: data.sort_order };
    if (data.id) await supabaseAdmin.from("our_sites").update(row).eq("id", data.id);
    else await supabaseAdmin.from("our_sites").insert(row);
    return { ok: true };
  });

export const adminDeleteSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("our_sites").delete().eq("id", data.id);
    return { ok: true };
  });

// ---------- About ----------
export const adminSaveAbout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ entries: z.record(z.string(), z.string()) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = Object.entries(data.entries).map(([key, value]) => ({ key, value }));
    if (rows.length) await supabaseAdmin.from("about_content").upsert(rows, { onConflict: "key" });
    return { ok: true };
  });

// ---------- Helpers (admin assistants) ----------
export const adminListHelpers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("admin_helpers").select("*").order("created_at", { ascending: false });
    return { helpers: data ?? [] };
  });

export const adminUpsertHelper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        email: z.string().email(),
        display_name: z.string().max(120).optional().default(""),
        can_see_admin_panel: z.boolean().default(true),
        can_see_notifications: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      email: data.email,
      display_name: data.display_name || null,
      can_see_admin_panel: data.can_see_admin_panel,
      can_see_notifications: data.can_see_notifications,
    };
    if (data.id) await supabaseAdmin.from("admin_helpers").update(row).eq("id", data.id);
    else await supabaseAdmin.from("admin_helpers").upsert(row, { onConflict: "email" });
    return { ok: true };
  });

export const adminDeleteHelper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_helpers").delete().eq("id", data.id);
    return { ok: true };
  });