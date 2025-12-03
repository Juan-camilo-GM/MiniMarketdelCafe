// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  loading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async () => {
    try {
      // 1. Forzamos obtener la sesión REAL (nunca falla)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // 2. Ya tenemos usuario → verificamos si es admin
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
      // ¡¡SIEMPRE!! quitamos el loading (esto es clave)
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus(); // primera vez

    // Listener para cambios futuros (login/logout desde otra pestaña, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      } else {
        // Volvemos a verificar solo si hay sesión
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

export const useAuth = () => useContext(AuthContext);