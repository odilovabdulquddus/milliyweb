import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : "/" }),
  head: () => ({ meta: [{ title: "Kirish / Ro'yxatdan o'tish — Milliy Web" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);

  // login
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPass, setLoginPass] = useState("");
  // register
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");

  useEffect(() => {
    if (user) navigate({ to: redirect as "/" });
  }, [user, redirect, navigate]);

  const doLogin = async () => {
    if (!loginPhone || !loginPass) return toast.error("Telefon va parolni kiriting");
    setLoading(true);
    try {
      await signIn(loginPhone, loginPass);
      toast.success("Xush kelibsiz!");
      navigate({ to: redirect as "/" });
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(msg);
      if (msg.includes("mavjud emas")) setTab("register");
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async () => {
    if (!name || !phone || !pass) return toast.error("Barcha maydonlarni to'ldiring");
    if (pass !== pass2) return toast.error("Parollar mos kelmadi");
    if (pass.length < 6) return toast.error("Parol kamida 6 ta belgi bo'lsin");
    setLoading(true);
    try {
      await signUp(name, phone, pass);
      toast.success("Akkaunt yaratildi!");
      navigate({ to: redirect as "/" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="mb-6 text-center text-3xl font-bold text-gradient">Milliy Web</h1>
      <Tabs value={tab} onValueChange={setTab} className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Kirish</TabsTrigger>
          <TabsTrigger value="register">Ro'yxatdan o'tish</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Telefon raqam</Label>
            <Input value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} placeholder="+998 ..." />
          </div>
          <div className="space-y-1.5">
            <Label>Parol</Label>
            <Input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
          </div>
          <Button onClick={doLogin} disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
            {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Kirish
          </Button>
        </TabsContent>

        <TabsContent value="register" className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Ism</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefon raqam</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 ..." />
          </div>
          <div className="space-y-1.5">
            <Label>Parol</Label>
            <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Parolni takrorlang</Label>
            <Input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doRegister()} />
          </div>
          <Button onClick={doRegister} disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
            {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Ro'yxatdan o'tish
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}