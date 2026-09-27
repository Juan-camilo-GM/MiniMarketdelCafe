import { Link, useLocation } from "react-router-dom";
import { 
  IoGridOutline, 
  IoCartOutline, 
  IoTimeOutline, 
  IoSettingsOutline, 
  IoLogOutOutline,
  IoMenu,
  IoClose,
  IoListOutline,
  IoStorefrontOutline,
  IoCalculatorOutline,
  IoPersonOutline
} from "react-icons/io5";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import BotonCerrarTienda from "../../pages/admin/BotonCerrarTienda";

export default function SidebarAdmin() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const adminLinks = [
    { to: "/admin/dashboard", label: "Resumen", icon: <IoTimeOutline className="text-2xl" /> },
    { to: "/admin/pedidos", label: "Pedidos", icon: <IoListOutline className="text-2xl" /> },
    { to: "/admin/venta", label: "Punto de Venta", icon: <IoCartOutline className="text-2xl" /> },
    { to: "/admin/cierre", label: "Cierre de Caja", icon: <IoCalculatorOutline className="text-2xl" /> },
    { to: "/admin/fiados", label: "Cartera / Fiados", icon: <IoPersonOutline className="text-2xl" /> },
    { to: "/admin", label: "Productos", icon: <IoGridOutline className="text-2xl" /> },
    { to: "/admin/proveedores", label: "Compras & Proveedores", icon: <IoStorefrontOutline className="text-2xl" /> },
    { to: "/admin/configuracion", label: "Configuración", icon: <IoSettingsOutline className="text-2xl" /> },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Botón Hamburguesa (Mobile) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between px-4 z-40 shadow-md">
        <div className="font-bold text-lg">Admin Panel</div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-white">
          <IoMenu size={28} />
        </button>
      </div>

      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-900 shadow-2xl z-[60] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">MiniMarket</h2>
              <p className="text-indigo-200 text-sm">Panel de Control</p>
            </div>
          </div>
          {/* Botón cerrar en mobile que aparece dentro del sidebar */}
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-indigo-200 hover:text-white p-1 bg-white/5 rounded-lg">
            <IoClose size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {adminLinks.map((link) => {
            const isActive = pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/50" 
                    : "text-indigo-200 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}

          <div className="pt-6 mt-6 border-t border-white/10">
            <BotonCerrarTienda variant="sidebar" />
          </div>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/catalogo"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-emerald-200 hover:bg-emerald-500/10 hover:text-emerald-100 rounded-xl transition-all font-medium"
          >
            <IoStorefrontOutline className="text-2xl" />
            Ver Catálogo Público
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-rose-200 hover:bg-rose-500/10 hover:text-rose-100 rounded-xl transition-all font-medium"
          >
            <IoLogOutOutline className="text-2xl" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
