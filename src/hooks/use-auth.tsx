import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfile, getMyProfile } from "@/lib/profile.functions";

export function phoneToEmail(value: string): string {
  const v = value.trim();
  if (v.includes("@")) return v.toLowerCase();
  return `u${v.replace(/\D/g, "")}@milliyweb.app`;
}

interface ProfileData {
  profile: { full_name: string | null; phone: string | null } | null;
  roles: string[];
  isAdmin: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  profile: ProfileData["profile"];
  refreshProfile: () => Promise<void>;
  signUp: (fullName: string, phone: string, password: string) => Promise<void>;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({ profile: null, roles: [], isAdmin: false });

  const refreshProfile = useCallback(async () => {
    try {
      const res = await getMyProfile();
      setProfileData(res as ProfileData);
    } catch {
      setProfileData({ profile: null, roles: [], isAdmin: false });
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => void refreshProfile(), 0);
      } else {
        setProfileData({ profile: null, roles: [], isAdmin: false });
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) void refreshProfile();
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshProfile]);

  const signUp = useCallback(
    async (fullName: string, phone: string, password: string) => {
      const email = phoneToEmail(phone);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone }, emailRedirectTo: window.location.origin },
      });
      if (error) throw new Error(error.message);
      await ensureProfile({ data: { fullName, phone } });
      await refreshProfile();
    },
    [refreshProfile],
  );

  const signIn = useCallback(
    async (phone: string, password: string) => {
      const email = phoneToEmail(phone);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("invalid")) {
          throw new Error("Bunday akkaunt mavjud emas yoki parol noto'g'ri");
        }
        throw new Error(error.message);
      }
      await ensureProfile({ data: {} }).catch(() => {});
      await refreshProfile();
    },
    [refreshProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfileData({ profile: null, roles: [], isAdmin: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin: profileData.isAdmin,
        profile: profileData.profile,
        refreshProfile,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}