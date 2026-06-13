import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMyOrders } from "@/lib/orders.functions";
import { formatSom } from "@/lib/pricing";

const ordersQuery = queryOptions({ queryKey: ["my-orders"], queryFn: () => getMyOrders() });

export const Route = createFileRoute("/_authenticated/my-orders")({
  head: () => ({ meta: [{ title: "Mening buyurtmalarim — Milliy Web" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(ordersQuery),
  component: MyOrders,
  errorComponent: () => <div className="p-10 text-center">Xatolik yuz berdi.</div>,
  notFoundComponent: () => <div className="p-10 text-center">Topilmadi.</div>,
});

const STATUS_VARIANT: Record<string, string> = {
  "Ishlab chiqilmoqda": "bg-amber-500/20 text-amber-300",
  Yaratilmoqda: "bg-blue-500/20 text-blue-300",
  Yaratildi: "bg-emerald-500/20 text-emerald-300",
};

function MyOrders() {
  const { data } = useSuspenseQuery(ordersQuery);
  const orders = data.orders;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Mening buyurtmalarim</h1>
      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">Hozircha buyurtmalar yo'q.</p>
          <Link to="/">
            <Button className="mt-4 bg-gradient-primary text-primary-foreground">Buyurtma berish</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{o.site_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {o.domain_name}{o.domain_ext} · {o.tariff}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_VARIANT[o.status] ?? "bg-muted"}`}>
                  {o.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>Muddat: {o.deadline_date ?? "-"}</span>
                {o.price_min != null && (
                  <span>Narx: {formatSom(Number(o.price_min))} – {formatSom(Number(o.price_max))}</span>
                )}
              </div>
              {o.ai_prompt && <p className="mt-2 text-sm">AI so'rov: {o.ai_prompt}</p>}
              {o.admin_notes && (
                <p className="mt-2 rounded-lg bg-muted p-2 text-sm">Izoh: {o.admin_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}