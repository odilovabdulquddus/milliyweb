import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { PhoneInput } from "@/components/PhoneInput";
import { updateMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profil — Milliy Web" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  const save = async () => {
    setLoading(true);
    try {
      await updateMyProfile({ data: { fullName: name, phone } });
      await refreshProfile();
      toast.success("Saqlandi");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold">Profil</h1>
      <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <div className="space-y-1.5">
          <Label>Ism</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Telefon raqam</Label>
          <PhoneInput value={phone} onValueChange={setPhone} />
        </div>
        <Button onClick={save} disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
          {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Saqlash
        </Button>
      </div>
    </div>
  );
}