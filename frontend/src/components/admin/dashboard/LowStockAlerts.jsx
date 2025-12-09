import { IoWarningOutline, IoAlertCircleOutline } from "react-icons/io5";

export default function LowStockAlerts({ productos, loading }) {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-fit">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <IoWarningOutline className="text-rose-500" />
                    Alerta de Stock
                </h3>
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-slate-400">Cargando...</p>
                </div>
            </div>
        );
    }

    if (productos.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-fit">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <IoWarningOutline className="text-rose-500" />
                    Alerta de Stock
                </h3>
                <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-full">
                    {productos.length}
                </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {productos.map((producto) => {
                    const isCritico = producto.stock <= 5;
                    const isAgotado = producto.stock === 0;

                    return (
                        <div
                            key={producto.id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isAgotado
                                    ? "bg-rose-50 border-rose-100"
                                    : "bg-white border-slate-100 hover:border-slate-200"
                                }`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-2 rounded-lg flex-shrink-0 ${isAgotado ? "bg-white text-rose-500" : "bg-orange-50 text-orange-500"
                                    }`}>
                                    {isAgotado ? <IoAlertCircleOutline size={18} /> : <IoWarningOutline size={18} />}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-semibold truncate ${isAgotado ? "text-rose-900" : "text-slate-700"}`}>
                                        {producto.nombre}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {isAgotado ? "Agotado" : "Quedan pocos"}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right flex-shrink-0 ml-2">
                                <p className={`text-lg font-bold ${isAgotado ? "text-rose-600" : "text-orange-500"
                                    }`}>
                                    {producto.stock}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase">
                                    Unidades
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
