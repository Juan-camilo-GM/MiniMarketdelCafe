import { IoTrendingUp, IoCashOutline, IoTimeOutline, IoCartOutline, IoWarningOutline } from "react-icons/io5";

export default function StatsCards({
    ventasHoy,
    ventasPeriodo,
    pedidosPendientes,
    ticketPromedio,
    stockBajoCount,
    agotadosCount
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Main KPI: Ventas Periodo */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg border border-indigo-600 p-5 md:p-6 text-white group overflow-hidden relative">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-white/20 transition-all"></div>
                <div className="relative flex items-start justify-between">
                    <div>
                        <p className="text-indigo-100 font-medium text-sm">Ventas del Período</p>
                        <p className="text-3xl font-black mt-2 group-hover:scale-105 transition-transform origin-left">
                            ${ventasPeriodo.toLocaleString("es-CO")}
                        </p>
                        <p className="text-xs text-indigo-200 mt-2 font-medium flex items-center gap-1">
                            <IoTrendingUp />
                            Ingresos totales
                        </p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <IoCashOutline className="text-2xl text-white" />
                    </div>
                </div>
            </div>

            {/* Ventas Hoy */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">Ventas Hoy</p>
                        <p className="text-3xl font-black text-slate-800 mt-2 group-hover:scale-105 transition-transform origin-left">
                            ${ventasHoy.toLocaleString("es-CO")}
                        </p>
                        <p className="text-xs text-emerald-500 mt-2 font-bold flex items-center gap-1">
                            <IoTrendingUp />
                            Actividad diaria
                        </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                        <IoTrendingUp className="text-2xl" />
                    </div>
                </div>
            </div>

            {/* Ticket Promedio */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">Ticket Promedio</p>
                        <p className="text-3xl font-black text-slate-800 mt-2 group-hover:scale-105 transition-transform origin-left">
                            ${ticketPromedio.toLocaleString("es-CO")}
                        </p>
                        <p className="text-xs text-purple-500 mt-2 font-bold flex items-center gap-1">
                            <IoCartOutline />
                            Por compra
                        </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                        <IoCartOutline className="text-2xl" />
                    </div>
                </div>
            </div>

            {/* Alertas Operativas (Pendientes + Stock) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-500 mb-4">Alertas Operativas</p>
                    <div className="flex items-center justify-between mb-3 group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-100 transition-colors">
                                <IoTimeOutline className="text-lg" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">Pedidos pendientes</span>
                        </div>
                        <span className="text-lg font-black text-slate-900">{pedidosPendientes}</span>
                    </div>
                    
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-50 rounded-lg text-rose-600 group-hover:bg-rose-100 transition-colors">
                                <IoWarningOutline className="text-lg" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">Stock crítico</span>
                        </div>
                        <span className="text-lg font-black text-slate-900">{stockBajoCount + agotadosCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
