// src/context/AuthContext.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContextDefinition";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined" && localStorage.getItem("is_demo_admin") === "true") {
      return { email: "demo@minimarket.com", id: "demo-admin", isDemo: true };
    }
    return null;
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("is_demo_admin") === "true";
  });
  const [loading, setLoading] = useState(true);

  const enterDemo = () => {
    localStorage.setItem("is_demo_admin", "true");
    setUser({ email: "demo@minimarket.com", id: "demo-admin", isDemo: true });
    setIsAdmin(true);
  };

  const logout = async () => {
    localStorage.removeItem("is_demo_admin");
    localStorage.removeItem("is_admin_cached");
    setUser(null);
    setIsAdmin(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out error", e);
    }
  };

  const checkAdminStatus = async () => {
    if (localStorage.getItem("is_demo_admin") === "true") {
      setUser({ email: "demo@minimarket.com", id: "demo-admin", isDemo: true });
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        localStorage.removeItem("is_admin_cached");
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (adminError) {
        console.error("Error verificando admin:", adminError);
        if (!navigator.onLine || adminError.message?.toLowerCase().includes("fetch")) {
          console.warn("Modo offline o error de red: usando estado de admin cacheado");
          setIsAdmin(localStorage.getItem("is_admin_cached") === "true");
        } else {
          setIsAdmin(false);
          localStorage.removeItem("is_admin_cached");
        }
      } else {
        const isAdminValue = !!adminData;
        setIsAdmin(isAdminValue);
        localStorage.setItem("is_admin_cached", isAdminValue ? "true" : "false");
      }

      setUser(session.user);
    } catch (err) {
      console.error("Error inesperado en auth:", err);
      if (!navigator.onLine) {
        setIsAdmin(localStorage.getItem("is_admin_cached") === "true");
      } else {
        setIsAdmin(false);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (localStorage.getItem("is_demo_admin") === "true") {
          return;
        }
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      } else {
        checkAdminStatus();
      }
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isDemoAdmin: user?.isDemo || false,
        enterDemo,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
