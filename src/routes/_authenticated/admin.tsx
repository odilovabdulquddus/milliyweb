import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Trash2, Plus, Save, Pencil, Copy, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  adminListUsers,
  adminUpdateUser,
  adminDeleteUser,
  adminSetRole,
  adminListOrders,
  adminUpdateOrder,
  adminDeleteOrder,
  adminUpsertSite,
  adminDeleteSite,
  adminSaveAbout,
  adminListHelpers,
  adminUpsertHelper,
  adminDeleteHelper,
} from "@/lib/admin.functions";
import { getPublicContent } from "@/lib/content.functions";
import { formatSom } from "@/lib/pricing";

const ADMIN_PASS = "00789";
const HELPER_PASS = "78900";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin panel — Milliy Web" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");

  if (!isAdmin) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">Sizda admin huquqi yo'q.</div>;
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-elegant">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-xl font-bold">Admin panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Parolni kiriting</p>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (pw === ADMIN_PASS ? setUnlocked(true) : toast.error("Noto'g'ri parol"))}
            className="mt-4 text-center"
          />
          <Button
            onClick={() => (pw === ADMIN_PASS ? setUnlocked(true) : toast.error("Noto'g'ri parol"))}
            className="mt-4 w-full bg-gradient-primary text-primary-foreground"
          >
            Kirish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Admin panel</h1>
      <Tabs defaultValue="orders" className="mt-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="orders">Buyurtmalar</TabsTrigger>
          <TabsTrigger value="sites">Bizning saytlar</TabsTrigger>
          <TabsTrigger value="about">Biz haqimizda</TabsTrigger>
          <TabsTrigger value="users">Foydalanuvchilar</TabsTrigger>
          <TabsTrigger value="helpers">Yordamchilar</TabsTrigger>
          <TabsTrigger value="code">Kodi</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6"><OrdersTab /></TabsContent>
        <TabsContent value="sites" className="mt-6"><SitesTab /></TabsContent>
        <TabsContent value="about" className="mt-6"><AboutTab /></TabsContent>
        <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
        <TabsContent value="helpers" className="mt-6"><HelpersTab /></TabsContent>
        <TabsContent value="code" className="mt-6"><CodeTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">{children}</div>;
}

/* ---------------- Orders ---------------- */
function OrdersTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-orders"], queryFn: () => adminListOrders() });
  const orders = data?.orders ?? [];

  const setStatus = async (id: string, status: string) => {
    await adminUpdateOrder({ data: { id, status: status as never } });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success("Holat yangilandi");
  };
  const saveNotes = async (id: string, admin_notes: string) => {
    await adminUpdateOrder({ data: { id, admin_notes } });
    toast.success("Saqlandi");
  };
  const del = async (id: string) => {
    await adminDeleteOrder({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  if (orders.length === 0) return <p className="text-muted-foreground">Buyurtmalar yo'q.</p>;

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <Box key={o.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{o.site_name}</h3>
              <p className="text-sm text-muted-foreground">{o.contact_name} · {o.contact_phone}</p>
              <p className="text-sm text-muted-foreground">{o.domain_name}{o.domain_ext} · {o.tariff}</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={o.status} onValueChange={(v) => setStatus(o.id, v)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ishlab chiqilmoqda">Ishlab chiqilmoqda</SelectItem>
                  <SelectItem value="Yaratilmoqda">Yaratilmoqda</SelectItem>
                  <SelectItem value="Yaratildi">Yaratildi</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => del(o.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Muddat: {o.deadline_date} · Narx: {o.price_min != null ? `${formatSom(Number(o.price_min))} – ${formatSom(Number(o.price_max))}` : "-"}
          </div>
          {o.ai_prompt && <p className="mt-2 text-sm">AI so'rov: {o.ai_prompt}</p>}
          {o.extras && Object.keys(o.extras).length > 0 && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-2 text-xs">{JSON.stringify(o.extras, null, 2)}</pre>
          )}
          {o.admin_prompt && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-primary">AI topshiriq (promt)</summary>
              <p className="mt-1 whitespace-pre-line rounded-lg bg-muted p-3 text-sm">{o.admin_prompt}</p>
            </details>
          )}
          <div className="mt-3 space-y-2">
            <Label>Izoh</Label>
            <Textarea defaultValue={o.admin_notes ?? ""} rows={2} id={`notes-${o.id}`} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveNotes(o.id, (document.getElementById(`notes-${o.id}`) as HTMLTextAreaElement).value)}
            >
              <Save className="mr-1 h-4 w-4" /> Saqlash
            </Button>
          </div>
        </Box>
      ))}
    </div>
  );
}

/* ---------------- Sites ---------------- */
function SitesTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["public-content"], queryFn: () => getPublicContent() });
  const sites = data?.sites ?? [];
  const [edit, setEdit] = useState<{ id?: string; title: string; url: string; image_url: string } | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["public-content"] });
  const save = async () => {
    if (!edit?.url) return toast.error("URL kiriting");
    await adminUpsertSite({ data: { id: edit.id, title: edit.title, url: edit.url, image_url: edit.image_url } });
    setEdit(null);
    refresh();
    toast.success("Saqlandi");
  };
  const del = async (id: string) => {
    await adminDeleteSite({ data: { id } });
    refresh();
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setEdit({ title: "", url: "", image_url: "" })} className="bg-gradient-primary text-primary-foreground">
        <Plus className="mr-1 h-4 w-4" /> Sayt qo'shish
      </Button>
      {edit && (
        <Box>
          <div className="space-y-3">
            <Input placeholder="Sarlavha" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            <Input placeholder="URL (https://...)" value={edit.url} onChange={(e) => setEdit({ ...edit, url: e.target.value })} />
            <Input placeholder="Rasm URL" value={edit.image_url} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={save} className="bg-gradient-primary text-primary-foreground"><Save className="mr-1 h-4 w-4" /> Saqlash</Button>
              <Button variant="outline" onClick={() => setEdit(null)}>Bekor</Button>
            </div>
          </div>
        </Box>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {sites.map((s) => (
          <Box key={s.id}>
            {s.image_url && <img src={s.image_url} alt={s.title ?? ""} className="mb-2 aspect-video w-full rounded-lg object-cover" />}
            <p className="font-medium">{s.title || s.url}</p>
            <p className="truncate text-xs text-muted-foreground">{s.url}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEdit({ id: s.id, title: s.title ?? "", url: s.url, image_url: s.image_url ?? "" })}>
                <Pencil className="mr-1 h-4 w-4" /> Tahrirlash
              </Button>
              <Button size="sm" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </Box>
        ))}
      </div>
    </div>
  );
}

/* ---------------- About ---------------- */
function AboutTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["public-content"], queryFn: () => getPublicContent() });
  const [a1, setA1] = useState<string | null>(null);
  const [a2, setA2] = useState<string | null>(null);
  const v1 = a1 ?? data?.about.about_1 ?? "";
  const v2 = a2 ?? data?.about.about_2 ?? "";

  const save = async () => {
    await adminSaveAbout({ data: { entries: { about_1: v1, about_2: v2 } } });
    qc.invalidateQueries({ queryKey: ["public-content"] });
    toast.success("Saqlandi");
  };

  return (
    <Box>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>1-mutaxassis</Label>
          <Textarea rows={4} value={v1} onChange={(e) => setA1(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>2-mutaxassis</Label>
          <Textarea rows={4} value={v2} onChange={(e) => setA2(e.target.value)} />
        </div>
        <Button onClick={save} className="bg-gradient-primary text-primary-foreground"><Save className="mr-1 h-4 w-4" /> Saqlash</Button>
      </div>
    </Box>
  );
}

/* ---------------- Users ---------------- */
function UsersTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-users"], queryFn: () => adminListUsers() });
  const users = data?.users ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const save = async (userId: string, fullName: string, phone: string) => {
    await adminUpdateUser({ data: { userId, fullName, phone } });
    toast.success("Saqlandi");
  };
  const toggleAdmin = async (userId: string, grant: boolean) => {
    await adminSetRole({ data: { userId, role: "admin", grant } });
    refresh();
    toast.success(grant ? "Admin huquqi berildi" : "Admin huquqi olib tashlandi");
  };
  const del = async (userId: string) => {
    if (!confirm("Foydalanuvchini o'chirishni tasdiqlaysizmi?")) return;
    await adminDeleteUser({ data: { userId } });
    refresh();
  };

  if (users.length === 0) return <p className="text-muted-foreground">Foydalanuvchilar yo'q.</p>;

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <Box key={u.user_id}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input defaultValue={u.full_name ?? ""} id={`un-${u.user_id}`} placeholder="Ism" />
            <Input defaultValue={u.phone ?? ""} id={`up-${u.user_id}`} placeholder="Telefon" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {u.email} {u.roles.length > 0 && `· ${u.roles.join(", ")}`}
          </p>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2">
            <Label className="text-sm">Admin panel huquqi</Label>
            <Switch checked={u.roles.includes("admin")} onCheckedChange={(v) => toggleAdmin(u.user_id, v)} />
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                save(
                  u.user_id,
                  (document.getElementById(`un-${u.user_id}`) as HTMLInputElement).value,
                  (document.getElementById(`up-${u.user_id}`) as HTMLInputElement).value,
                )
              }
            >
              <Save className="mr-1 h-4 w-4" /> Saqlash
            </Button>
            <Button size="sm" variant="ghost" onClick={() => del(u.user_id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </Box>
      ))}
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function HelpersTab() {
  const qc = useQueryClient();
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const { data } = useQuery({ queryKey: ["admin-helpers"], queryFn: () => adminListHelpers(), enabled: unlocked });
  const helpers = data?.helpers ?? [];
  const [draft, setDraft] = useState({ email: "", display_name: "", can_see_admin_panel: true, can_see_notifications: true });

  if (!unlocked) {
    return (
      <Box>
        <div className="mx-auto max-w-sm text-center">
          <Lock className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Yordamchilar bo'limi paroli</p>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-3 text-center" />
          <Button
            onClick={() => (pw === HELPER_PASS ? setUnlocked(true) : toast.error("Noto'g'ri parol"))}
            className="mt-3 w-full bg-gradient-primary text-primary-foreground"
          >
            Kirish
          </Button>
        </div>
      </Box>
    );
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-helpers"] });
  const add = async () => {
    if (!draft.email) return toast.error("Email kiriting");
    await adminUpsertHelper({ data: draft });
    setDraft({ email: "", display_name: "", can_see_admin_panel: true, can_see_notifications: true });
    refresh();
    toast.success("Qo'shildi");
  };
  const toggle = async (h: { id: string; email: string; display_name: string | null; can_see_admin_panel: boolean; can_see_notifications: boolean }, field: "can_see_admin_panel" | "can_see_notifications", value: boolean) => {
    await adminUpsertHelper({
      data: {
        id: h.id,
        email: h.email,
        display_name: h.display_name ?? "",
        can_see_admin_panel: field === "can_see_admin_panel" ? value : h.can_see_admin_panel,
        can_see_notifications: field === "can_see_notifications" ? value : h.can_see_notifications,
      },
    });
    refresh();
  };
  const del = async (id: string) => {
    await adminDeleteHelper({ data: { id } });
    refresh();
  };

  return (
    <div className="space-y-4">
      <Box>
        <h3 className="font-semibold">Admin yordamchisi qo'shish</h3>
        <div className="mt-3 space-y-3">
          <Input placeholder="Email manzili" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          <Input placeholder="Nomi (masalan: helper, builder, Admin helper)" value={draft.display_name} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} />
          <div className="flex items-center justify-between"><Label>Admin panel tugmasini ko'rsatish</Label><Switch checked={draft.can_see_admin_panel} onCheckedChange={(v) => setDraft({ ...draft, can_see_admin_panel: v })} /></div>
          <div className="flex items-center justify-between"><Label>Ogohlantirish tugmasini ko'rsatish</Label><Switch checked={draft.can_see_notifications} onCheckedChange={(v) => setDraft({ ...draft, can_see_notifications: v })} /></div>
          <Button onClick={add} className="bg-gradient-primary text-primary-foreground"><Plus className="mr-1 h-4 w-4" /> Qo'shish</Button>
        </div>
      </Box>
      {helpers.map((h) => (
        <Box key={h.id}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{h.display_name || h.email}</p>
              <p className="text-xs text-muted-foreground">{h.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => del(h.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between"><Label>Admin panel ko'rsatish</Label><Switch checked={h.can_see_admin_panel} onCheckedChange={(v) => toggle(h, "can_see_admin_panel", v)} /></div>
            <div className="flex items-center justify-between"><Label>Ogohlantirish ko'rsatish</Label><Switch checked={h.can_see_notifications} onCheckedChange={(v) => toggle(h, "can_see_notifications", v)} /></div>
          </div>
        </Box>
      ))}
    </div>
  );
}