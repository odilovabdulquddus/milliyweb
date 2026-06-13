import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computePrice, getDeadlineOption, getTariff, formatSom } from "./pricing";

const OrderInput = z.object({
  siteName: z.string().trim().min(1, "Sayt nomi kerak").max(120),
  domainName: z.string().trim().max(120).optional().default(""),
  domainExt: z.string().trim().max(20).optional().default(".uz"),
  aiPrompt: z.string().trim().max(1000).optional().default(""),
  aiPreviewHtml: z.string().max(200_000).optional().default(""),
  extras: z
    .object({
      telegramBot: z.boolean().default(false),
      telegramValue: z.string().max(300).default(""),
      googleMaps: z.boolean().default(false),
      googleMapsValue: z.string().max(300).default(""),
      other: z.string().max(1000).default(""),
    })
    .default({ telegramBot: false, telegramValue: "", googleMaps: false, googleMapsValue: "", other: "" }),
  logoUrl: z.string().max(2000).optional().default(""),
  imageUrl: z.string().max(2000).optional().default(""),
  contactName: z.string().trim().min(1, "Ism kerak").max(120),
  contactPhone: z.string().trim().min(5, "Telefon kerak").max(40),
  deadlineDays: z.number().int(),
  tariff: z.string().max(40),
});

export const submitOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => OrderInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const price = computePrice(data.deadlineDays, data.tariff);
    const dl = getDeadlineOption(data.deadlineDays);
    const tariff = getTariff(data.tariff);
    const deadlineDate = new Date(Date.now() + data.deadlineDays * 86_400_000).toISOString().slice(0, 10);

    const { generateAdminPrompt } = await import("./ai.server");
    const adminPrompt = await generateAdminPrompt({
      site_name: data.siteName,
      domain_name: data.domainName,
      domain_ext: data.domainExt,
      ai_prompt: data.aiPrompt,
      extras: data.extras,
      tariff: data.tariff,
    });

    const { data: inserted, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        site_name: data.siteName,
        domain_name: data.domainName || null,
        domain_ext: data.domainExt || null,
        ai_prompt: data.aiPrompt || null,
        ai_preview_html: data.aiPreviewHtml || null,
        extras: data.extras,
        logo_url: data.logoUrl || null,
        image_url: data.imageUrl || null,
        contact_name: data.contactName,
        contact_phone: data.contactPhone,
        deadline_days: data.deadlineDays,
        deadline_date: deadlineDate,
        price_min: price.min,
        price_max: price.max,
        tariff: data.tariff,
        tariff_extra: tariff.extra,
        total_price: price.total,
        status: "Ishlab chiqilmoqda",
        admin_prompt: adminPrompt || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabase.from("notifications").insert({
      user_id: userId,
      order_id: inserted.id,
      title: "Buyurtmangiz qabul qilindi",
      body: `"${data.siteName}" bo'yicha buyurtma yaratildi. Muddat: ${dl.label}.`,
    });

    const extrasLines: string[] = [];
    if (data.extras.telegramBot) extrasLines.push(`Telegram bot: ${data.extras.telegramValue || "ha"}`);
    if (data.extras.googleMaps) extrasLines.push(`Google Maps API: ${data.extras.googleMapsValue || "ha"}`);
    if (data.extras.other) extrasLines.push(`Boshqa: ${data.extras.other}`);

    const msg = [
      "🆕 <b>YANGI BUYURTMA</b>",
      `🌐 Sayt: <b>${data.siteName}</b>`,
      `🔗 Domen: ${data.domainName || "-"}${data.domainExt || ""}`,
      `👤 Mijoz: ${data.contactName}`,
      `📞 Telefon: ${data.contactPhone}`,
      `⏳ Muddat: ${dl.label} (${deadlineDate})`,
      `💎 Tarif: ${data.tariff}`,
      `💰 Narx: ${formatSom(price.min)} - ${formatSom(price.max)}`,
      data.aiPrompt ? `🤖 AI so'rov: ${data.aiPrompt}` : "",
      extrasLines.length ? `➕ Qo'shimcha:\n${extrasLines.join("\n")}` : "",
      adminPrompt ? `\n📋 <b>Topshiriq:</b>\n${adminPrompt.slice(0, 2500)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { sendTelegram } = await import("./telegram.server");
    await sendTelegram(msg);

    return { ok: true, id: inserted.id };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

export const getMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { notifications: data ?? [] };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    return { ok: true };
  });

export const checkMyReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: orders } = await supabase
      .from("orders")
      .select("id,site_name,deadline_date,status,last_reminder_at")
      .eq("user_id", userId)
      .neq("status", "Yaratildi");
    const now = Date.now();
    let created = 0;
    for (const o of orders ?? []) {
      const last = o.last_reminder_at ? new Date(o.last_reminder_at).getTime() : 0;
      if (now - last >= 2 * 86_400_000) {
        await supabase.from("notifications").insert({
          user_id: userId,
          order_id: o.id,
          title: "Eslatma",
          body: `"${o.site_name}" sayti ustida ish davom etmoqda. Topshirish muddati: ${o.deadline_date ?? "-"}.`,
        });
        await supabase.from("orders").update({ last_reminder_at: new Date().toISOString() }).eq("id", o.id);
        created++;
      }
    }
    return { created };
  });