// src/components/admin/BotonCerrarTienda.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { IoStorefrontOutline } from "react-icons/io5";
import toast from "react-hot-toast";

export default function BotonCerrarTienda({ variant = "desktop" }) {
  const [cerrada, setCerrada] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from("tienda_estado").select("cerrada").single();
      setCerrada(data?.cerrada ?? false);
    };
    cargar();

    const channel = supabase
      .channel("tienda_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "tienda_estado" }, (p) => {
        setCerrada(p.new.cerrada);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const toggleTienda = async () => {
    if (loading) return;

    const nuevoEstado = !cerrada;
    setCerrada(nuevoEstado); // cambio instantáneo
    setLoading(true);

    const { error } = await supabase
      .from("tienda_estado")
      .update({
        cerrada: nuevoEstado,
        mensaje: nuevoEstado ? "Volvemos pronto" : "¡Estamos abiertos!",
        reabre_a: null,
      })
      .eq("id", 1);

    if (error) {
      setCerrada(!nuevoEstado); // revertir si falla
      toast.error("Error de conexión");
      console.error(error);
    }
    setLoading(false);
  };

  // Estilos para Desktop (Navbar)
  if (variant === "desktop") {
    const baseClasses = "flex items-center gap-2.5 px-4 py-2 rounded-lg font-medium transition-all duration-200";
    const estadoClasses = cerrada
      ? "bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-500/30"
      : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-500/30";
    const loadingClasses = loading ? "opacity-70 cursor-not-allowed" : "";

    return (
      <button
        onClick={toggleTienda}
        disabled={loading}
        className={`${baseClasses} ${estadoClasses} ${loadingClasses} relative w-full cursor-pointer`}
      >
        <IoStorefrontOutline className="text-xl" />
        <span className="min-w-20 text-center">
          {loading ? "..." : cerrada ? "Cerrada" : "Abierta"}
        </span>

        {/* Spinner discreto solo cuando carga */}
        {loading && (
          <div className="absolute -right-1 -top-1">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </button>
    );
  }

  // Estilos para Sidebar (Mobile)
  const baseClasses = "w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all text-base";
  const estadoClasses = cerrada
    ? "bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-500/30"
    : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-500/30";
  const loadingClasses = loading ? "opacity-70 cursor-not-allowed" : "";

  return (
    <button
      onClick={toggleTienda}
      disabled={loading}
      className={`${baseClasses} ${estadoClasses} ${loadingClasses} relative cursor-pointer`}
    >
      <IoStorefrontOutline className="text-xl" />
      <span className="flex-1 text-left">
        Tienda {loading ? "..." : cerrada ? "Cerrada" : "Abierta"}
      </span>

      {/* Spinner discreto solo cuando carga */}
      {loading && (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      )}
    </button>
  );
}