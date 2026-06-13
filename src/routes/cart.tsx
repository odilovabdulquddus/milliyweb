import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadDraft, type OrderDraft } from "@/lib/order-draft";
import { computePrice, formatSom, getDeadlineOption } from "@/lib/pricing";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Savatcha — Milliy Web" }] }),
  component: CartPage,
});

function CartPage() {
  const [draft, setDraft] = useState<Partial<OrderDraft>>({});
  useEffect(() => setDraft(loadDraft()), []);

  const hasDraft = draft.siteName || draft.aiPrompt;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <ShoppingCart className="h-7 w-7" /> Savatcha
      </h1>
      {!hasDraft ? (
        <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">Savatcha bo'sh.</p>
          <Link to="/">
            <Button className="mt-4 bg-gradient-primary text-primary-foreground">Sayt yaratishni boshlash</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3 rounded-2xl border border-border bg-card p-6 shadow-elegant">
          <Row label="Sayt nomi" value={draft.siteName || "-"} />
          <Row label="Domen" value={`${draft.domainName || "-"}${draft.domainExt || ""}`} />
          <Row label="Muddat" value={getDeadlineOption(draft.deadlineDays ?? 14).label} />
          <Row label="Tarif" value={draft.tariff || "Oddiy"} />
          {draft.deadlineDays && draft.tariff && (
            <Row
              label="Taxminiy narx"
              value={(() => {
                const p = computePrice(draft.deadlineDays, draft.tariff);
                return `${formatSom(p.min)} – ${formatSom(p.max)}`;
              })()}
            />
          )}
          <Link to="/order">
            <Button className="mt-3 w-full bg-gradient-primary text-primary-foreground">
              Buyurtmani davom ettirish <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}