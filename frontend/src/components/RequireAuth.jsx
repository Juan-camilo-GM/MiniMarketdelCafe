import { useEffect, useState } from "react";
// Rutas corregidas para acceder a 'lib' y 'components' desde 'pages/admin'
import { supabase } from "../lib/supabase"; 
import { Navigate } from "react-router-dom";
import SessionLoader from ".//SessionLoader"; 

/**
 * Componente de protección de ruta para verificar la autenticación
 * y los permisos de administrador del usuario antes de renderizar los 'children'.
 */
export default function RequireAuth({ children }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      setChecking(true);
      
      // 1. Obtener la sesión actual del usuario
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }

      // 2. Verificamos la tabla 'admins' para confirmar permisos
      const { data, error } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error comprobando admin:", error);
        if (mounted) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }

      // 3. Establecer el estado final
      if (mounted) {
        // Si hay datos, significa que el usuario es admin
        setAllowed(!!data); 
        setChecking(false);
      }
    };

    check();

    // Opcional: listener de cambios en auth (útil si la sesión cambia en tiempo real)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, _session) => {
      check(); // Re-chequea los permisos ante cualquier cambio de estado de autenticación
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  // ************ CONDICIÓN DE CARGA MEJORADA ************
  if (checking) {
    return <SessionLoader message="Verificando permisos de administrador..." />;
  }
  // ****************************************************

  // Si no está permitido, redirige a la página de login de admin
  if (!allowed) {
    return <Navigate to="/admin/login" replace />;
  }
  
  // Si está permitido, renderiza los componentes hijos
  return children;
}