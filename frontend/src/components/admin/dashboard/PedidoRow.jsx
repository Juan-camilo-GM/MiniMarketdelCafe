import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    IoPersonOutline,
    IoCartOutline,
    IoCheckmarkCircle,
    IoCloseCircle,
    IoTrashBin,
} from "react-icons/io5";
import PedidoDetails from "./PedidoDetails";

export default function PedidoRow({ pedido, onEstadoChange, onEliminar }) {
    const [expandido, setExpandido] = useState(false);

    return (
        <>
            <tr
                className={`cursor-pointer transition-all border-b border-slate-100 last:border-0 ${expandido ? "bg-indigo-50/30" : "hover:bg-slate-50"
                    }`}
                onClick={() => setExpandido(!expandido)}
            >
                <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${expandido ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                            {expandido ? "▼" : <IoPersonOutline />}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">{pedido.cliente_nombre || "Sin nombre"}</p>
                            <p className="text-xs text-slate-500 font-medium">
                                {format(new Date(pedido.created_at), "d MMM yyyy • HH:mm", { locale: es })}
                            </p>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700">
                    ${parseInt(pedido.total || 0).toLocaleString("es-CO")}
                </td>
                <td className="px-6 py-4">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${pedido.estado === "confirmado"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : pedido.estado === "pendiente"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                    >
                        {pedido.estado?.toUpperCase() || "SIN ESTADO"}
                    </span>
                </td>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                        {pedido.estado !== "confirmado" && (
                            <button
                                onClick={() => onEstadoChange(pedido.id, "confirmado")}
                                className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Confirmar"
                            >
                                <IoCheckmarkCircle size={20} />
                            </button>
                        )}
                        {pedido.estado !== "cancelado" && (
                            <button
                                onClick={() => onEstadoChange(pedido.id, "cancelado")}
                                className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Cancelar"
                            >
                                <IoCloseCircle size={20} />
                            </button>
                        )}
                        <button
                            onClick={() => onEliminar(pedido.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Eliminar"
                        >
                            <IoTrashBin size={18} />
                        </button>
                    </div>
                </td>
            </tr>

            {expandido && (
                <tr>
                    <td colSpan="4" className="px-0 py-0 border-b border-slate-100">
                        <PedidoDetails pedido={pedido} />
                    </td>
                </tr>
            )}
        </>
    );
}
