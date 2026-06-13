export interface OrderDraft {
  siteName: string;
  domainName: string;
  domainExt: string;
  aiPrompt: string;
  aiPreviewHtml: string;
  extras: { telegramBot: boolean; telegramValue: string; googleMaps: boolean; googleMapsValue: string; other: string };
  logoUrl: string;
  imageUrl: string;
  contactName: string;
  contactPhone: string;
  deadlineDays: number;
  tariff: string;
}

const KEY = "milliyweb_order_draft";

export function saveDraft(d: Partial<OrderDraft>) {
  if (typeof window === "undefined") return;
  try {
    const cur = loadDraft();
    localStorage.setItem(KEY, JSON.stringify({ ...cur, ...d }));
  } catch {
    /* ignore */
  }
}

export function loadDraft(): Partial<OrderDraft> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<OrderDraft>) : {};
  } catch {
    return {};
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}