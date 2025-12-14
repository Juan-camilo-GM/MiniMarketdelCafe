import { useState, useEffect } from "react";
import { IoArrowForward, IoCart } from "react-icons/io5";

export default function BannerOfertas({ productos, agregarAlCarrito }) {
    const [ofertas, setOfertas] = useState([]);
    const [indiceActual, setIndiceActual] = useState(0);

    useEffect(() => {
        // Filtrar productos destacados
        const destacados = productos.filter(p => p.is_featured);
        setOfertas(destacados);
    }, [productos]);

    // Auto-slide para el carrusel
    useEffect(() => {
        if (ofertas.length <= 1) return;
        const intervalo = setInterval(() => {
            setIndiceActual((prev) => (prev + 1) % ofertas.length);
        }, 6000);
        return () => clearInterval(intervalo);
    }, [ofertas]);

    // Si no hay ofertas, no mostrar nada
    if (ofertas.length === 0) return null;

    const productoActual = ofertas[indiceActual];

    if (!productoActual) return null;

    return (
        <div className="w-full px-4 md:px-8 lg:px-12 pt-20 md:pt-24 mb-4">
            <div className="relative w-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/20 text-white group">

                {/* === DECORACIÓN DE FONDO (Sutil) === */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="flex flex-row items-center p-4 md:p-6 min-h-[140px] md:min-h-[180px]">

                    {/* === IMAGEN (Izquierda) === */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-48 md:h-48 flex-shrink-0 mr-4 md:mr-8 perspective-1000">
                        {productoActual.imagen_url ? (
                            <img
                                src={productoActual.imagen_url}
                                alt={productoActual.nombre}
                                className="w-full h-full object-cover rounded-xl shadow-md border-2 border-white/20 transform md:group-hover:scale-105 md:group-hover:-rotate-2 transition-all duration-500"
                            />
                        ) : (
                            <div className="w-full h-full bg-white/10 rounded-xl flex items-center justify-center border-2 border-white/20">
                                <span className="text-4xl">☕</span>
                            </div>
                        )}

                        {/* Badge 'Oferta' sobre la imagen en móvil para ahorrar espacio */}
                        <div className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 text-[9px] md:text-xs font-black px-2 py-0.5 rounded-full shadow-sm z-10 border border-white/30">
                            ★ OFERTA DEL DÍA
                        </div>
                    </div>

                    {/* === CONTENIDO (Derecha) === */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">

                        <h2 className="text-lg sm:text-2xl md:text-3xl font-black leading-tight mb-1 truncate text-white drop-shadow-sm">
                            {productoActual.nombre}
                        </h2>

                        <p className="text-indigo-50 text-xs sm:text-sm md:text-base font-medium line-clamp-2 md:line-clamp-2 mb-3 leading-snug opacity-90">
                            ¡Sabor único y especial! Disponible para entrega inmediata aquí en el conjunto.
                        </p>

                        <div className="flex items-center gap-2 md:gap-4 mt-auto">
                            <button
                                onClick={() => agregarAlCarrito(productoActual)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-white text-indigo-700 font-bold rounded-lg shadow-sm active:scale-95 transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-gray-50"
                            >
                                <IoCart className="text-base md:text-lg" />
                                <span>Add ${parseFloat(productoActual.precio).toLocaleString("es-CO")}</span>
                            </button>

                            {/* Paginación pequeña */}
                            {ofertas.length > 1 && (
                                <div className="hidden sm:flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded-full">
                                    {ofertas.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`rounded-full transition-all ${idx === indiceActual ? "w-4 h-1 bg-white" : "w-1 h-1 bg-white/40"}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Barra de progreso / Paginación móvil */}
                {ofertas.length > 1 && (
                    <div className="absolute bottom-0 left-0 h-0.5 bg-white/20 w-full sm:hidden">
                        <div
                            className="h-full bg-yellow-400 transition-all duration-300"
                            style={{ width: `${((indiceActual + 1) / ofertas.length) * 100}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    );
}
