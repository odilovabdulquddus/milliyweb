const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function generateHtmlSite(prompt: string, variation: number): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY sozlanmagan");

  const styleHints = [
    "zamonaviy minimalist, ko'p oq bo'shliq",
    "to'q (dark) mavzu, neon gradientlar",
    "iliq, do'stona ranglar va katta tugmalar",
    "premium, hashamatli, oltin urg'ular",
    "yorqin va o'ynoqi, kartochkalar bilan",
  ];
  const hint = styleHints[variation % styleHints.length];

  const system =
    "Sen tajribali web dizaynersan. Foydalanuvchi so'roviga ko'ra TO'LIQ, 100% tayyor bitta HTML sahifa yarat. " +
    "Faqat bitta to'liq HTML hujjat qaytar (<!DOCTYPE html> dan </html> gacha). Barcha CSS <style> ichida bo'lsin, tashqi fayllar yo'q. " +
    "Matnlar o'zbek tilida bo'lsin. Rasmlar o'rniga https://images.unsplash.com or gradient/CSS shakllardan foydalan. " +
    "Sahifa chiroyli, responsiv va real biznesga tayyor ko'rinishda bo'lsin. Hech qanday izoh yoki markdown belgilari (```) qo'shma.";

  const user = `Quyidagi sayt uchun to'liq tayyor namuna yarat: "${prompt}".\nDizayn uslubi: ${hint}.`;

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "custom",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.9,
    }),
  });

  if (res.status === 429) throw new Error("AI hozir band (limit). Birozdan keyin qayta urinib ko'ring.");
  if (res.status === 402) throw new Error("AI krediti tugagan. Iltimos hisobni to'ldiring.");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI xatosi [${res.status}]: ${t.slice(0, 200)}`);
  }

  const data = await res.json();
  let html: string = data?.choices?.[0]?.message?.content ?? "";
  html = html.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return html;
}

export async function generateAdminPrompt(order: {
  site_name: string;
  domain_name?: string | null;
  domain_ext?: string | null;
  ai_prompt?: string | null;
  extras?: Record<string, unknown> | null;
  tariff?: string | null;
}): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return "";
  const system =
    "Sen loyiha menejerisan. Buyurtma ma'lumotlariga asoslanib, dasturchi uchun sayt qanday qilinishi kerakligini " +
    "aniq, bosqichma-bosqich o'zbekcha texnik topshiriq (prompt) yoz. Qisqa va amaliy bo'lsin.";
  const user = JSON.stringify(order);
  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "custom" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}