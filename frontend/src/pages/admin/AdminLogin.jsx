import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from "react-icons/io5";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica del formulario
    if (!email || !password) {
      toast.error("Por favor, completa todos los campos", {
        icon: <IoAlertCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }
    
    setLoading(true);
    
    // Mostrar toast de carga
    const loadingToast = toast.loading("Verificando credenciales...", {
      duration: Infinity,
    });
    
    try {
      // Intentamos login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.dismiss(loadingToast);
        
        // Mensajes de error específicos según el tipo de error
        let mensajeError = "Error al iniciar sesión";
        let duracion = 5000;
        
        if (error.message.includes("Invalid login credentials")) {
          mensajeError = "Credenciales inválidas. Verifica tu email y contraseña.";
          duracion = 6000;
        } else if (error.message.includes("Email not confirmed")) {
          mensajeError = "Email no confirmado. Por favor, verifica tu cuenta.";
          duracion = 7000;
        } else if (error.message.includes("network")) {
          mensajeError = "Error de conexión. Verifica tu internet e intenta de nuevo.";
          duracion = 6000;
        } else {
          mensajeError = error.message || "Error al iniciar sesión";
        }
        
        toast.error(mensajeError, {
          icon: <IoCloseCircleOutline size={22} />,
          duration: duracion,
        });
        
        setLoading(false);
        return;
      }

      // Si hay sesión, verificamos que sea admin (tabla admins)
      const user = data?.user;
      if (!user) {
        toast.dismiss(loadingToast);
        toast.error("No se pudo obtener información del usuario.", {
          icon: <IoCloseCircleOutline size={22} />,
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      // Verificar permisos de administrador
      const { data: admins, error: errAdm } = await supabase
        .from("admins")
        .select("id, user_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (errAdm) {
        console.error(errAdm);
        toast.dismiss(loadingToast);
        toast.error("Error verificando permisos de administrador.", {
          icon: <IoCloseCircleOutline size={22} />,
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      if (!admins) {
        // No es admin
        toast.dismiss(loadingToast);
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex flex-col border border-gray-200`}>
            <div className="flex-1 p-5">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <IoAlertCircleOutline className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Acceso denegado</h3>
                  <p className="mt-1 text-gray-600">Este usuario no tiene permisos de administrador.</p>
                </div>
              </div>
            </div>
            <div className="flex border-t border-gray-200">
              <button
                onClick={async () => {
                  toast.dismiss(t.id);
                  await supabase.auth.signOut();
                  setLoading(false);
                }}
                className="flex-1 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-bl-xl rounded-br-xl transition"
              >
                Entendido
              </button>
            </div>
          </div>
        ), {
          duration: Infinity,
        });
        
        // Cerrar sesión automáticamente después de un tiempo
        setTimeout(async () => {
          await supabase.auth.signOut();
        }, 10000); // 10 segundos
        
        return;
      }

      // Login exitoso
      toast.dismiss(loadingToast);
      toast.success("¡Bienvenido administrador!", {
        icon: <IoCheckmarkCircleOutline size={22} />,
        duration: 3000,
      });
      
      // Pequeña pausa antes de redirigir
      setTimeout(() => {
        navigate("/admin");
      }, 500);
      
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error inesperado:", error);
      
      toast.error("Ocurrió un error inesperado. Por favor, intenta de nuevo.", {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 5000,
      });
      
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Ingresa tus credenciales para acceder al sistema</p>
        </div>
        
        <form onSubmit={onSubmit} className="w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Inicio de Sesión</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ejemplo.com"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                "Ingresar al Panel"
              )}
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Solo personal autorizado puede acceder a esta sección
            </p>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Sistema de Administración. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}