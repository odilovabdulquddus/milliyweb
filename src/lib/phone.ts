// Uzbekistan phone formatting helpers. Always keeps the +998 prefix and
// formats as: +998 90 123 45 67
export function formatUzPhone(input: string): string {
  let digits = (input || "").replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  let out = "+998";
  if (digits.length > 0) out += " " + digits.slice(0, 2);
  if (digits.length > 2) out += " " + digits.slice(2, 5);
  if (digits.length > 5) out += " " + digits.slice(5, 7);
  if (digits.length > 7) out += " " + digits.slice(7, 9);
  return out;
}

export function isCompleteUzPhone(value: string): boolean {
  const d = (value || "").replace(/\D/g, "").replace(/^998/, "");
  return d.length === 9;
}

export function normalizeUzPhone(value: string): string {
  const d = (value || "").replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  return d ? "+998" + d : "";
}
