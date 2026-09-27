// src/context/AuthContext.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContextDefinition";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async () => {
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
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}