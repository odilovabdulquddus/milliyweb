import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typewriter } from "@/components/Typewriter";
import { getPublicContent } from "@/lib/content.functions";
import { saveDraft } from "@/lib/order-draft";

const contentQuery = queryOptions({
  queryKey: ["public-content"],
  queryFn: () => getPublicContent(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Milliy Web — AI bilan sayt buyurtma qiling" },
      {
        name: "description",
        content: "Sayt nomini kiriting, AI bir zumda namuna ko'rsatadi. Domen tanlang, qo'shimchalarni belgilang va buyurtma bering.",
      },
      { property: "og:title", content: "Milliy Web — AI bilan sayt buyurtma qiling" },
      { property: "og:description", content: "Zamonaviy saytlarni AI yordamida loyihalashtiramiz va yaratamiz." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  component: Index,
  errorComponent: () => <div className="p-10 text-center">Sahifani yuklashda xatolik.</div>,
  notFoundComponent: () => <div className="p-10 text-center">Topilmadi.</div>,
});

const IDEAS = [
  "Telefon do'koni sayti...",
  "Restoran va menyu sayti...",
  "Dorixona onlayn sayti...",
  "Portfolio sayti...",
  "Maktab yoki o'quv markazi...",
  "Ko'chmas mulk agentligi...",
];

function Index() {
  const { data } = useSuspenseQuery(contentQuery);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => {
    const v = name.trim();
    if (!v) {
      inputRef.current?.focus();
      return;
    }
    saveDraft({ siteName: v });
    navigate({ to: "/order" });
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center md:py-32">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground whitespace-pre-line">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> SAYTNI MATN BOYICHA MUAMMOLARNITOGIRLASH TEKIN{"\n"}
          </span>
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Orzuingizdagi saytni <span className="text-gradient">buyurtma qiling</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Sayt nomini kiriting va boshlang. AI sizga tayyor namunani ko'rsatadi.
          </p>

          <div className="mt-10 w-full max-w-md">
            <div className="relative">
              <Input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && start()}
                className="h-14 rounded-xl border-border bg-card/70 text-center text-lg shadow-elegant"
                aria-label="Sayt nomini kiriting"
              />
              {!name && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg text-muted-foreground/70">
                  <Typewriter words={["Saytning nomini kiriting...", ...IDEAS]} />
                </div>
              )}
            </div>
            <Button
              onClick={start}
              size="lg"
              className="mt-5 h-14 w-full rounded-xl bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow"
            >
              Boshlash <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Biz haqimizda</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <AboutCard
            text={
              data.about.about_1 ||
              "Odilov Abdulquddus 13 yosh, IT sohasi mutaxassisi, 2 yillik tajribaga ega. Hozirda 4 joy bilan hamkorligi bor: Med I life dorixona, Ahmadbek Majmuasi, Quddus Ice Cream, Apple UZ."
            }
          />
          <AboutCard
            text={
              data.about.about_2 ||
              "Tursunov Shoxjahon 14 yosh, IT sohasi mutaxassisi, 2.5 yillik tajribaga ega. Hozirda 3 ta joy bilan hamkorligi bor: Snap Eld, Codeforge, Ahmadbek Majmuasi."
            }
          />
        </div>
      </section>

      {/* Our sites */}
      <section id="sites" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Bizning Saytlar</h2>
        {data.sites.length === 0 ? (
          <p className="mt-8 text-center text-muted-foreground">Tez orada...</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.sites.map((s) => (
              <a
                key={s.id}
                href={s.url.startsWith("http") ? s.url : `https://${s.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-glow"
              >
                <div className="aspect-video overflow-hidden bg-muted">
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.title ?? s.url}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">{s.title ?? s.url}</div>
                  )}
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="truncate text-sm font-medium">{s.title || s.url}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AboutCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
      <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
