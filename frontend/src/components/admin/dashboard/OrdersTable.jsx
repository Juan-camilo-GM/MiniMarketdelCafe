import { IoDownloadOutline } from "react-icons/io5";
import PedidoRow from "./PedidoRow";
import PedidoMobileCard from "./PedidoMobileCard";

export default function OrdersTable({
    pedidos,
    onEstadoChange,
    onEliminar,
    onExport,
    pagina,
    setPagina,
    totalPaginas,
    totalResultados,
    itemsPorPagina
}) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-5 md:p-6 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Resultados de Búsqueda</h3>
                    <p className="text-sm text-slate-500 font-medium">{totalResultados} pedidos encontrados</p>
                </div>
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4">Cliente / Fecha</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pedidos.map((p) => (
                            <PedidoRow
                                key={p.id}
                                pedido={p}
                                onEstadoChange={onEstadoChange}
                                onEliminar={onEliminar}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4 bg-slate-50/50">
                {pedidos.map((p) => (
                    <PedidoMobileCard
                        key={p.id}
                        pedido={p}
                        onEstadoChange={onEstadoChange}
                        onEliminar={onEliminar}
                    />
                ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm bg-slate-50/50 mt-auto">
                    <span className="text-slate-500 font-medium text-center sm:text-left">
                        Mostrando <span className="text-slate-800 font-bold">{(pagina - 1) * itemsPorPagina + 1}</span> a <span className="text-slate-800 font-bold">{Math.min(pagina * itemsPorPagina, totalResultados)}</span> de <span className="text-slate-800 font-bold">{totalResultados}</span>
                    </span>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setPagina((p) => Math.max(1, p - 1))}
                            disabled={pagina === 1}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                            disabled={pagina === totalPaginas}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
