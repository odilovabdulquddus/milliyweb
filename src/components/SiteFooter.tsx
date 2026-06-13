import { Phone, Send } from "lucide-react";

export function SiteFooter() {
  return (
    <footer id="contact" className="mt-24 border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold text-gradient">Milliy Web</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Zamonaviy saytlarni AI yordamida loyihalashtiramiz va yaratamiz. G'oyangizni biz hayotga tatbiq etamiz.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Aloqa markazi</h4>
            <a
              href="tel:+998902608888"
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Phone className="h-4 w-4" /> +998 90 260 88 88
            </a>
          </div>
          <div>
            <h4 className="font-semibold">Telegram</h4>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <a
                href="https://t.me/odilovabdulquddus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Send className="h-4 w-4" /> @odilovabdulquddus
              </a>
              <a
                href="https://t.me/shtursunov7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Send className="h-4 w-4" /> @shtursunov7
              </a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Milliy Web. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
}