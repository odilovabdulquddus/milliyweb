import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Sparkles, RefreshCw, Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOMAIN_EXTENSIONS } from "@/lib/domains";
import { DEADLINE_OPTIONS, TARIFFS, computePrice, formatSom } from "@/lib/pricing";
import { loadDraft, saveDraft, clearDraft, type OrderDraft } from "@/lib/order-draft";
import { generateSitePreview } from "@/lib/ai.functions";
import { submitOrder } from "@/lib/orders.functions";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Buyurtma berish — Milliy Web" },
      { name: "description", content: "Sayt buyurtmangizni rasmiylashtiring: domen, AI namuna, qo'shimchalar, tarif va narx." },
    ],
  }),
  component: OrderPage,
});

const DEFAULT: OrderDraft = {
  siteName: "",
  domainName: "",
  domainExt: ".uz",
  aiPrompt: "",
  aiPreviewHtml: "",
  extras: { telegramBot: false, telegramValue: "", googleMaps: false, googleMapsValue: "", other: "" },
  logoUrl: "",
  imageUrl: "",
  contactName: "",
  contactPhone: "",
  deadlineDays: 14,
  tariff: "Oddiy",
};

function OrderPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<OrderDraft>(DEFAULT);
  const [variation, setVariation] = useState(0);

  useEffect(() => {
    const d = loadDraft();
    setForm((f) => ({ ...f, ...d, extras: { ...f.extras, ...(d.extras ?? {}) } }));
  }, []);

  useEffect(() => {
    if (user && profile) {
      setForm((f) => ({
        ...f,
        contactName: f.contactName || profile.full_name || "",
        contactPhone: f.contactPhone || profile.phone || "",
      }));
    }
  }, [user, profile]);

  const update = (patch: Partial<OrderDraft>) => {
    setForm((f) => {
      const next = { ...f, ...patch };
      saveDraft(next);
      return next;
    });
  };

  const price = computePrice(form.deadlineDays, form.tariff);

  const previewMut = useMutation({
    mutationFn: (v: number) =>
      generateSitePreview({ data: { prompt: form.aiPrompt || form.siteName, variation: v } }),
    onSuccess: (res) => update({ aiPreviewHtml: res.html }),
    onError: (e: Error) => toast.error(e.message),
  });

  const generate = (next: boolean) => {
    if (!(form.aiPrompt || form.siteName).trim()) {
      toast.error("Avval sayt nomi yoki AI so'rovini kiriting");
      return;
    }
    const v = next ? variation + 1 : variation;
    setVariation(v);
    previewMut.mutate(v);
  };

  const uploadFile = async (file: File, field: "logoUrl" | "imageUrl") => {
    if (!user) {
      toast.error("Fayl yuklash uchun avval akkauntga kiring (yoki URL kiriting)");
      return;
    }
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = await supabase.storage.from("uploads").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (data?.signedUrl) update({ [field]: data.signedUrl } as Partial<OrderDraft>);
    toast.success("Yuklandi");
  };

  const submitMut = useMutation({
    mutationFn: () =>
      submitOrder({
        data: {
          siteName: form.siteName,
          domainName: form.domainName,
          domainExt: form.domainExt,
          aiPrompt: form.aiPrompt,
          aiPreviewHtml: form.aiPreviewHtml,
          extras: form.extras,
          logoUrl: form.logoUrl,
          imageUrl: form.imageUrl,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          deadlineDays: form.deadlineDays,
          tariff: form.tariff,
        },
      }),
    onSuccess: () => {
      clearDraft();
      toast.success("Buyurtmangiz qabul qilindi!");
      navigate({ to: "/my-orders" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.siteName.trim()) return toast.error("Sayt nomini kiriting");
    if (!form.contactName.trim()) return toast.error("Ismingizni kiriting");
    if (!form.contactPhone.trim()) return toast.error("Telefon raqamingizni kiriting");
    if (!user) {
      saveDraft(form);
      toast.message("Buyurtma berish uchun akkauntga kiring");
      navigate({ to: "/auth", search: { redirect: "/order" } });
      return;
    }
    submitMut.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Buyurtma berish</h1>
      <p className="mt-1 text-muted-foreground">Ma'lumotlaringiz avtomatik saqlanadi.</p>

      <div className="mt-8 space-y-8">
        {/* Site name + domain */}
        <Card title="Sayt va domen">
          <Field label="Sayt nomi">
            <Input value={form.siteName} onChange={(e) => update({ siteName: e.target.value })} placeholder="Masalan: Quddus Store" />
          </Field>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Field label="Domen nomi">
              <Input value={form.domainName} onChange={(e) => update({ domainName: e.target.value })} placeholder="quddusstore" />
            </Field>
            <Field label="Tugatma">
              <Select value={form.domainExt} onValueChange={(v) => update({ domainExt: v })}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {DOMAIN_EXTENSIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Card>

        {/* AI preview */}
        <Card title="AI namuna">
          <p className="text-sm text-muted-foreground">
            AI ga saytingiz qanday bo'lishini yozing. Masalan: "Menga telefon do'kon saytini qilib ber".
          </p>
          <Textarea
            value={form.aiPrompt}
            onChange={(e) => update({ aiPrompt: e.target.value })}
            placeholder="Menga ... saytini qilib ber"
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => generate(false)} disabled={previewMut.isPending} className="bg-gradient-primary text-primary-foreground">
              {previewMut.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
              AI namuna ko'rsat
            </Button>
            {form.aiPreviewHtml && (
              <Button variant="outline" onClick={() => generate(true)} disabled={previewMut.isPending}>
                <RefreshCw className="mr-1 h-4 w-4" /> Boshqasini tanlash
              </Button>
            )}
          </div>
          {form.aiPreviewHtml && (
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe title="AI namuna" srcDoc={form.aiPreviewHtml} className="h-[460px] w-full bg-white" sandbox="allow-scripts" />
            </div>
          )}
        </Card>

        {/* Extras */}
        <Card title="Qo'shimcha imkoniyatlar">
          <ToggleRow
            label="Telegram botga ulash"
            checked={form.extras.telegramBot}
            onChange={(v) => update({ extras: { ...form.extras, telegramBot: v } })}
          >
            {form.extras.telegramBot && (
              <Input
                value={form.extras.telegramValue}
                onChange={(e) => update({ extras: { ...form.extras, telegramValue: e.target.value } })}
                placeholder="Bot token yoki bot username"
              />
            )}
          </ToggleRow>
          <ToggleRow
            label="Google Maps API"
            checked={form.extras.googleMaps}
            onChange={(v) => update({ extras: { ...form.extras, googleMaps: v } })}
          >
            {form.extras.googleMaps && (
              <Input
                value={form.extras.googleMapsValue}
                onChange={(e) => update({ extras: { ...form.extras, googleMapsValue: e.target.value } })}
                placeholder="API key (ixtiyoriy) yoki manzil"
              />
            )}
          </ToggleRow>
          <Field label="Boshqa izohlar">
            <Textarea
              value={form.extras.other}
              onChange={(e) => update({ extras: { ...form.extras, other: e.target.value } })}
              rows={2}
              placeholder="Qo'shimcha talablaringiz..."
            />
          </Field>
        </Card>

        {/* Logo + image */}
        <Card title="Logo va rasm">
          <UploadField label="Logo" value={form.logoUrl} onUrl={(v) => update({ logoUrl: v })} onFile={(f) => uploadFile(f, "logoUrl")} />
          <UploadField label="Sayt rasmi" value={form.imageUrl} onUrl={(v) => update({ imageUrl: v })} onFile={(f) => uploadFile(f, "imageUrl")} />
        </Card>

        {/* Contact + deadline */}
        <Card title="Aloqa va muddat">
          <Field label="Ism">
            <Input value={form.contactName} onChange={(e) => update({ contactName: e.target.value })} />
          </Field>
          <Field label="Telefon raqam">
            <Input value={form.contactPhone} onChange={(e) => update({ contactPhone: e.target.value })} placeholder="+998 ..." />
          </Field>
          <Field label="Qaysi muddatgacha kerak">
            <Select value={String(form.deadlineDays)} onValueChange={(v) => update({ deadlineDays: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEADLINE_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={String(d.value)}>
                    {d.label} — {formatSom(d.min)} dan {formatSom(d.max)} gacha
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Card>

        {/* Tariffs */}
        <Card title="Tariflar">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TARIFFS.map((t) => (
              <button
                key={t.value}
                onClick={() => update({ tariff: t.value })}
                className={`rounded-xl border p-4 text-left transition ${
                  form.tariff === t.value ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="font-semibold">{t.label}</div>
                <div className="mt-1 text-xs text-accent">{t.extra > 0 ? `+${formatSom(t.extra)}` : "Qo'shimchasiz"}</div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {t.perks.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </Card>

        {/* Total + submit */}
        <div className="sticky bottom-4 rounded-2xl border border-border bg-card/95 p-5 shadow-elegant backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taxminiy narx</p>
              <p className="text-2xl font-bold text-gradient">
                {formatSom(price.min)} – {formatSom(price.max)}
              </p>
            </div>
            <Button onClick={handleSubmit} disabled={submitMut.isPending} size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">
              {submitMut.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Buyurtma berish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-elegant">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
      {children}
    </div>
  );
}

function UploadField({
  label,
  value,
  onUrl,
  onFile,
}: {
  label: string;
  value: string;
  onUrl: (v: string) => void;
  onFile: (f: File) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onUrl(e.target.value)} placeholder="URL kiriting yoki fayl yuklang" />
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-3 text-sm hover:bg-accent/10">
          <Upload className="h-4 w-4" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>
      </div>
      {value && <img src={value} alt={label} className="mt-2 h-20 rounded-md border border-border object-contain" />}
    </div>
  );
}