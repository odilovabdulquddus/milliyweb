export interface DeadlineOption {
  value: number; // days
  label: string;
  min: number;
  max: number;
}

export const DEADLINE_OPTIONS: DeadlineOption[] = [
  { value: 7, label: "7 kun ichida", min: 500_000, max: 1_000_000 },
  { value: 14, label: "14 kun ichida", min: 400_000, max: 850_000 },
  { value: 30, label: "1 oy ichida", min: 300_000, max: 500_000 },
  { value: 45, label: "1 oydan ko'p", min: 150_000, max: 280_000 },
];

export interface TariffOption {
  value: string;
  label: string;
  extra: number;
  perks: string[];
}

export const TARIFFS: TariffOption[] = [
  { value: "Oddiy", label: "Oddiy", extra: 0, perks: ["Asosiy dizayn", "Mobil moslashuv", "1 sahifa"] },
  { value: "O'rta", label: "O'rta", extra: 0, perks: ["Yaxshilangan dizayn", "Bir nechta sahifa", "Asosiy SEO"] },
  { value: "Professional", label: "Professional", extra: 20_000, perks: ["Premium dizayn", "Animatsiyalar", "To'liq SEO", "Admin panel"] },
  { value: "Expert", label: "Expert", extra: 50_000, perks: ["Eng yuqori daraja", "Maxsus funksiyalar", "AI integratsiya", "Doimiy qo'llab-quvvatlash"] },
];

export function formatSom(n: number): string {
  // Deterministic formatting (same on server and client) to avoid hydration mismatches.
  const digits = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return digits + " so'm";
}

export function getDeadlineOption(days: number): DeadlineOption {
  return DEADLINE_OPTIONS.find((d) => d.value === days) ?? DEADLINE_OPTIONS[0];
}

export function getTariff(value: string): TariffOption {
  return TARIFFS.find((t) => t.value === value) ?? TARIFFS[0];
}

export function computePrice(days: number, tariff: string) {
  const d = getDeadlineOption(days);
  const t = getTariff(tariff);
  return {
    min: d.min + t.extra,
    max: d.max + t.extra,
    extra: t.extra,
    total: d.max + t.extra,
  };
}