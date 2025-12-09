import { IoSearch } from "react-icons/io5";

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
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <IoSearch className="text-indigo-500" />
                Filtros de Búsqueda
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Cliente</label>
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Estado</label>
                    <select
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    >
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Desde</label>
                        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Hasta</label>
                        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
