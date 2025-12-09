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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Ventas hoy</p>
                        <p className="text-3xl font-black text-emerald-600 mt-2 group-hover:scale-105 transition-transform origin-left">
                            ${ventasHoy.toLocaleString("es-CO")}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                        <IoTrendingUp className="text-2xl" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total período</p>
                        <p className="text-3xl font-black text-indigo-600 mt-2 group-hover:scale-105 transition-transform origin-left">
                            ${ventasPeriodo.toLocaleString("es-CO")}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                        <IoCashOutline className="text-2xl" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Pendientes</p>
                        <p className="text-3xl font-black text-amber-500 mt-2 group-hover:scale-105 transition-transform origin-left">{pedidosPendientes}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-colors">
                        <IoTimeOutline className="text-2xl" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Ticket promedio</p>
                        <p className="text-3xl font-black text-purple-600 mt-2 group-hover:scale-105 transition-transform origin-left">
                            ${ticketPromedio.toLocaleString("es-CO")}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-500 group-hover:bg-purple-100 transition-colors">
                        <IoCartOutline className="text-2xl" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Stock bajo</p>
                        <p className="text-3xl font-black text-rose-500 mt-2 group-hover:scale-105 transition-transform origin-left">{stockBajoCount}</p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                            {agotadosCount} agotados
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-500 group-hover:bg-rose-100 transition-colors">
                        <IoWarningOutline className="text-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
