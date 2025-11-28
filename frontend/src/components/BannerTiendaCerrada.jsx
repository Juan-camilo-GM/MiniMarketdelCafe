// src/components/BannerTiendaCerrada.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function BannerTiendaCerrada({ children }) {
  const [cerrada, setCerrada] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from("tienda_estado").select("cerrada").single();
      setCerrada(data?.cerrada || false);
    };
    cargar();

    const channel = supabase
      .channel("tienda_banner")
      .on("postgres_changes", { event: "*", schema: "public", table: "tienda_estado" }, (p) => {
        setCerrada(p.new.cerrada);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  if (!cerrada) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-900 via-pink-800 to-purple-900 flex items-center justify-center px-6">
      <div className="text-center text-white">
        <div className="mb-12">
          <div className="inline-block p-10 bg-white/20 backdrop-blur-xl rounded-2xl rounded-full animate-pulse">
            <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-8">Tienda Cerrada</h1>
        <p className="text-4xl md:text-6xl font-bold">Volvemos pronto</p>
        <p className="mt-12 text-5xl md:text-7xl font-black animate-bounce">¡Hasta luego!</p>
      </div>
    </div>
  );
}