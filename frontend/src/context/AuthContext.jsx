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
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (adminError) {
        console.error("Error verificando admin:", adminError);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!adminData);
      }

      setUser(session.user);
    } catch (err) {
      console.error("Error inesperado en auth:", err);
      setIsAdmin(false);
      setUser(null);
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