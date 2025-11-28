// src/components/admin/BotonCerrarTienda.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { IoStorefrontOutline } from "react-icons/io5";

export default function BotonCerrarTienda() {
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
      alert("Error de conexión");
      console.error(error);
    }
    setLoading(false);
  };

  const baseClasses = "flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold transition-all duration-300";
  const estadoClasses = cerrada
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-emerald-600 hover:bg-emerald-700 text-white";
  const loadingClasses = loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105 shadow-lg";

  return (
    <button
      onClick={toggleTienda}
      disabled={loading}
      className={`${baseClasses} ${estadoClasses} ${loadingClasses} relative w-full`}
    >
      <IoStorefrontOutline className="text-xl" />
      <span className="min-w-20 text-center">
        {loading ? "..." : cerrada ? "CERRADA" : "ABIERTA"}
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