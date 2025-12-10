import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { IoMenu, IoClose, IoLogOut, IoCart, IoGrid, IoTime, IoSearch, IoChevronDown, IoChevronForward } from "react-icons/io5";
import { obtenerCategorias } from "../lib/categorias";
import BotonCerrarTienda from "../pages/admin/BotonCerrarTienda";

export default function Navbar() {
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get("categoria");
  const [busqueda, setBusqueda] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for Sidebar



  // Sincronizar input con URL (Solo si la URL cambia externamente)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== busqueda) {
      setBusqueda(q);
    }
  }, [searchParams]);

  // Búsqueda en tiempo real (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      const qInUrl = searchParams.get("q") || "";
      if (busqueda !== qInUrl) {
        navigate(`/catalogo?q=${encodeURIComponent(busqueda)}`, {
          replace: pathname === '/catalogo'
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda, pathname, navigate, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const qInUrl = searchParams.get("q") || "";
    if (busqueda !== qInUrl) {
      navigate(`/catalogo?q=${encodeURIComponent(busqueda)}`, {
        replace: pathname === '/catalogo'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setIsAdminLogged(false);
      const { data } = await supabase.from("admins").select("id").eq("user_id", user.id).single();
      setIsAdminLogged(!!data);
    };
    checkAdmin();

    // Cargar categorías
    obtenerCategorias().then(setCategorias);
  }, [pathname]);

  // VISTA PÚBLICA
  const clientLinks = [
    { to: "/", label: "Catálogo", icon: <IoGrid className="text-xl" /> },
  ];

  // VISTA ADMIN
  const adminLinks = [
    { to: "/admin", label: "Productos", icon: <IoGrid className="text-xl" /> },
    { to: "/admin/venta", label: "Nueva Venta", icon: <IoCart className="text-xl" /> },
    { to: "/admin/historial", label: "Dashboard", icon: <IoTime className="text-xl" /> },
  ];

  const links = pathname.startsWith("/admin") && isAdminLogged ? adminLinks : clientLinks;
  const isAdminRoute = pathname.startsWith("/admin") && isAdminLogged;
  const isLoginRoute = pathname === "/admin/login";

  const showSearch = !isAdminRoute && !isLoginRoute;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 shadow-2xl transition-all duration-300 ${scrolled ? 'py-4' : 'py-4 sm:py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">

          {/* PRIMERA FILA: Logo, Search (Desktop), Menu */}
          <div className="flex items-center justify-between gap-4">

            {/* LOGO */}
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white shadow-lg border border-white/20 transition-transform group-hover:scale-105">
                <IoCart className="text-2xl" />
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-tight text-white leading-none">
                  Mini Market
                </h1>
                <span className="text-indigo-200 text-sm">del Café</span>
                {isAdminRoute && (
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30 hidden sm:inline-block">
                    ADMIN
                  </span>
                )}
              </div>
            </Link>

            {/* BUSCADOR (Visible solo en Desktop y Cliente, NO en Login) */}
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg relative group">
                <input
                  type="text"
                  placeholder="¿Qué se te antoja hoy?"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-indigo-200 
                            focus:outline-none focus:bg-white/20 focus:scale-105 transition-all outline-none"
                />
                <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-200 group-focus-within:text-white transition-colors" />
              </form>
            )}

            {/* MENÚ DE ESCRITORIO */}
            {!isLoginRoute && (
              <ul className="hidden lg:flex items-center gap-1">
                {links.map((link) => {
                  const isActive = pathname === link.to;

                  // Special rendering for 'Catálogo' to include Dropdown
                  if (link.label === "Catálogo") {
                    return (
                      <li key={link.to}>
                        <button
                          onClick={() => setIsSidebarOpen(true)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                                ${isActive || isSidebarOpen ? "bg-white/20 text-white shadow-lg border border-white/20" : "text-indigo-100 hover:bg-white/10 hover:text-white"}`}
                        >
                          {link.icon}
                          <span>{link.label}</span>
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                        ${isActive
                            ? "bg-white/20 text-white shadow-lg border border-white/20"
                            : "text-indigo-100 hover:text-white hover:bg-white/10"
                          }`}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  );
                })}

                {/* Opciones extra solo para Admin */}
                {isAdminRoute && (
                  <>
                    <li className="ml-4 pl-4 border-l border-white/20 flex items-center gap-3">
                      <BotonCerrarTienda />
                    </li>
                    <li>
                      <button
                        onClick={() => supabase.auth.signOut()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/20 text-rose-100 hover:bg-rose-500 hover:text-white font-medium transition-all duration-200 border border-rose-500/20"
                      >
                        <IoLogOut className="text-lg" />
                        Salir
                      </button>
                    </li>
                  </>
                )}
              </ul>
            )}

            {/* BOTÓN MÓVIL (Hamburguesa) */}
            {!isLoginRoute && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <IoMenu className="text-3xl" />
              </button>
            )}
          </div>

          {/* SEGUNDA FILA: Buscador Móvil (Visible solo en móvil y cliente, NO en Login) */}
          {showSearch && (
            <div className="md:hidden pb-1">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder="¿Qué se te antoja hoy?"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-200 
                            focus:outline-none focus:bg-white/20 transition-all text-sm"
                />
                <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-200" />
              </form>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR DRAWER */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity duration-500 ease-in-out ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-purple-800 via-indigo-700 to-purple-900 shadow-3xl z-[70] transform transition-transform duration-500 cubic-bezier(0.25, 1, 0.5, 1) flex flex-col border-r border-white/10
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <h2 className="text-2xl font-black text-white tracking-tight">Cátalogo</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
          >
            <IoClose className="text-3xl" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-hide">
          {/* Main Navigation */}
          {isAdminRoute && (
            <nav className="space-y-2 pb-6 border-b border-white/10">
              {links.filter(l => l.label !== "Catálogo").map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 text-white hover:bg-white/10 rounded-xl font-bold transition-all text-lg"
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}

              <button
                onClick={() => { supabase.auth.signOut(); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-4 px-4 py-3 text-rose-200 hover:bg-rose-500/20 rounded-xl font-bold transition-all text-lg"
              >
                <IoLogOut className="text-xl" />
                Cerrar Sesión
              </button>
            </nav>
          )}

          {/* Categories Section - Solo en vista pública */}
          {!isAdminRoute && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-4 mb-2">
                <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Explorar</span>
                <Link to="/catalogo" onClick={() => setIsSidebarOpen(false)} className="text-xs text-white/80 hover:text-white underline">Ver todo</Link>
              </div>

              <div className="grid gap-1">
                {categorias.map(cat => {
                  const isActive = currentCategory === cat.id.toString();
                  return (
                    <Link
                      key={cat.id}
                      to={`/catalogo?categoria=${cat.id}`}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all border border-transparent
                                      ${isActive
                          ? 'bg-white text-purple-700 shadow-xl border-white scale-[1.02]'
                          : 'text-indigo-100 hover:bg-white/10 hover:ml-2'}`}
                    >
                      {cat.nombre}
                      {isActive && <IoChevronForward />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}