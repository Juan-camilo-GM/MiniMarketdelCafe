import { useState } from "react";
import { IoSearch, IoFilterOutline, IoCalendarOutline } from "react-icons/io5";

export default function DashboardFilters({
    filtro,
    setFiltro,
    estadoFiltro,
    setEstadoFiltro,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin
}) {
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    // Contar cuántos filtros están activos (estado o fecha diferente a los últimos 30 días)
    const filtrosActivos = (estadoFiltro ? 1 : 0);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center">
                
                {/* Search Bar & Mobile Toggle */}
                <div className="flex gap-2 w-full xl:w-96 items-center flex-shrink-0">
                    <div className="relative w-full">
                        <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm text-slate-700 font-medium placeholder:text-slate-400"
                        />
                    </div>
                    
                    <button 
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className={`xl:hidden flex-shrink-0 flex items-center justify-center p-2.5 rounded-xl border transition-all ${mostrarFiltros || filtrosActivos > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                        <IoFilterOutline size={20} />
                        {filtrosActivos > 0 && (
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                </div>

                <div className="w-full h-px xl:w-px xl:h-8 bg-slate-200 hidden xl:block"></div>

                {/* Filters Content */}
                <div className={`${mostrarFiltros ? 'flex' : 'hidden'} xl:flex flex-col sm:flex-row gap-4 items-center justify-end w-full animate-in slide-in-from-top-2 duration-200`}>
                    
                    {/* Status Select */}
                    <div className="relative w-full xl:w-auto">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <IoFilterOutline />
                        </div>
                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            className="w-full xl:w-48 pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-semibold text-slate-700 appearance-none cursor-pointer"
                        >
                            <option value="">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmado">Confirmado</option>
                            <option value="cancelado">Cancelado</option>
                        </select>
                    </div>

                    {/* Date Pickers */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full xl:w-auto">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm relative flex-1">
                            <IoCalendarOutline className="text-slate-400" />
                            <input 
                                type="date" 
                                value={fechaInicio} 
                                onChange={(e) => setFechaInicio(e.target.value)} 
                                className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full cursor-pointer" 
                            />
                        </div>
                        <span className="hidden sm:inline text-slate-300 font-bold text-center">—</span>
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm relative flex-1">
                            <IoCalendarOutline className="text-slate-400 sm:hidden" />
                            <input 
                                type="date" 
                                value={fechaFin} 
                                onChange={(e) => setFechaFin(e.target.value)} 
                                className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full cursor-pointer" 
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
