import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { IoMenu, IoClose, IoLogOut, IoCart, IoGrid, IoTime } from "react-icons/io5";
import BotonCerrarTienda from "../pages/admin/BotonCerrarTienda";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setIsAdminLogged(false);
      const { data } = await supabase.from("admins").select("id").eq("user_id", user.id).single();
      setIsAdminLogged(!!data);
    };
    checkAdmin();
  }, [pathname]);

  // VISTA PÚBLICA: Solo Inicio (eliminado Catálogo)
  const clientLinks = [
    { to: "/", label: "Catálogo", icon: <IoGrid className="text-xl" /> },
  ];

  // VISTA ADMIN
  const adminLinks = [
    { to: "/admin", label: "Panel Principal", icon: <IoGrid className="text-xl" /> },
    { to: "/admin/historial", label: "Historial", icon: <IoTime className="text-xl" /> },
  ];

  const links = pathname.startsWith("/admin") && isAdminLogged ? adminLinks : clientLinks;
  const isAdminRoute = pathname.startsWith("/admin") && isAdminLogged;

  // CLASE COMÚN: El gradiente ahora es fijo para todo el Navbar
  const navBackground = "bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 shadow-2xl";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-white/10 ${navBackground}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* LOGO (Diseño Unificado) */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-white/30 group-hover:scale-110 transition-all duration-300">
              <span className="text-2xl font-black text-white"> <IoCart /></span>
            </div>
            <div>
              <h1 className="font-black text-xl lg:text-2xl tracking-tight text-white">
                Mini Market del Café
              </h1>
              {isAdminRoute && <p className="text-white/70 text-xs font-medium -mt-1">Admin Panel</p>}
            </div>
          </Link>

          {/* MENÚ DE ESCRITORIO */}
          <ul className="hidden lg:flex items-center gap-2">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold transition-all duration-300 border border-transparent
                    ${pathname === link.to
                      ? "bg-white/25 text-white shadow-lg border-white/20" // Activo
                      : "text-white/80 hover:bg-white/15" // Inactivo
                    }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}

            {/* Opciones extra solo para Admin */}
            {isAdminRoute && (
              <>
                <li className="ml-2 pl-2 border-l border-white/20"><BotonCerrarTienda /></li>
                <li>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-red-500/80 hover:bg-red-600 text-white font-bold shadow-lg transition-all duration-300 hover:scale-105 border border-red-400/30"
                  >
                    <IoLogOut className="text-xl" />
                    Salir
                  </button>
                </li>
              </>
            )}
          </ul>

          {/* BOTÓN MÓVIL */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all"
          >
            {open ? <IoClose className="text-2xl" /> : <IoMenu className="text-2xl" />}
          </button>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      {open && (
        <div className="lg:hidden border-t border-white/20">
          <ul className="px-4 py-4 space-y-2 bg-gradient-to-b from-purple-900/95 to-indigo-900/95 backdrop-blur-xl">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl font-bold text-lg transition-all duration-300 border border-transparent
                    ${pathname === link.to
                      ? "bg-white/25 text-white border-white/20"
                      : "text-white/80 hover:bg-white/15"
                    }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              </li>
            ))}

            {isAdminRoute && (
              <>
                <li className="pt-2"><BotonCerrarTienda /></li>
                <li>
                  <button
                    onClick={() => { supabase.auth.signOut(); setOpen(false); }}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg transition-all duration-300 mt-2"
                  >
                    <IoLogOut className="text-xl" />
                    Salir
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}