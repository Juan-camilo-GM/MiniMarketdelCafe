import { IoDownloadOutline } from "react-icons/io5";
import PedidoRow from "./PedidoRow";

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
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Pedidos Recientes</h3>
                        <p className="text-sm text-slate-500">Gestiona los últimos pedidos recibidos</p>
                    </div>
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                    >
                        <IoDownloadOutline size={16} />
                        Exportar
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4 rounded-tl-lg">Cliente / Fecha</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 rounded-tr-lg">Acciones</th>
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

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center text-sm bg-slate-50/50 mt-auto">
                    <span className="text-slate-500 font-medium">
                        Mostrando <span className="text-slate-800 font-bold">{(pagina - 1) * itemsPorPagina + 1}</span> a <span className="text-slate-800 font-bold">{Math.min(pagina * itemsPorPagina, totalResultados)}</span> de <span className="text-slate-800 font-bold">{totalResultados}</span>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagina((p) => Math.max(1, p - 1))}
                            disabled={pagina === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                            disabled={pagina === totalPaginas}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
