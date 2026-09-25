import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { IoMegaphoneOutline } from "react-icons/io5";

export default function Megafono() {
    const [mensaje, setMensaje] = useState("");

    const cargarMensaje = async () => {
        const { data, error } = await supabase
            .from("configuracion")
            .select("valor")
            .eq("clave", "mensaje_megafono")
            .single();
            
        if (!error && data) {
            setMensaje(data.valor || "");
        }
    };

    useEffect(() => {
        cargarMensaje();

        // Suscripción en tiempo real
        const channel = supabase
            .channel('megafono_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracion' }, (payload) => {
                if (payload.new && payload.new.clave === 'mensaje_megafono') {
                    setMensaje(payload.new.valor || "");
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (!mensaje) return null;

    return (
        <div className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 px-4 py-2 shadow-sm overflow-hidden whitespace-nowrap flex items-center border-b border-amber-500 relative z-30 mb-2">
            <div className="flex items-center gap-2 bg-amber-500/50 px-3 py-0.5 rounded-full z-10 font-black shrink-0 shadow-sm border border-amber-300/50 text-sm">
                <IoMegaphoneOutline size={18} />
                <span className="hidden sm:inline">NUEVO:</span>
            </div>
            
            <div className="w-full overflow-hidden ml-3 relative flex items-center h-full">
                {/* Doble texto para efecto infinito suave */}
                <div className="animate-marquee inline-block text-sm font-bold tracking-wide">
                    {mensaje} <span className="mx-8 text-amber-700/30">✦</span> {mensaje} <span className="mx-8 text-amber-700/30">✦</span> {mensaje}
                </div>
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
                .animate-marquee {
                    display: inline-block;
                    white-space: nowrap;
                    animation: marquee 15s linear infinite;
                    padding-right: 50px;
                }
            `}</style>
        </div>
    );
}
