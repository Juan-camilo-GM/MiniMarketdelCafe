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
                    <div className="flex gap-2">
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
                        <div className="bg-indigo-50/30 p-6">
                            <div className="max-w-4xl mx-auto bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <IoCartOutline className="text-indigo-500" />
                                        Detalle del Pedido #{pedido.id}
                                    </h4>
                                    <span className="text-sm text-slate-500">{pedido.productos?.length || 0} productos</span>
                                </div>

                                {/* INFO EXTRA DEL PEDIDO */}
                                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 bg-indigo-50/10">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Tipo de Entrega</p>
                                        <p className="text-slate-800 font-medium capitalize flex items-center gap-2">
                                            {pedido.tipo_entrega === "domicilio" ? "Domicilio" : "En tienda"}
                                        </p>
                                    </div>
                                    {pedido.tipo_entrega === "domicilio" && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase">Dirección</p>
                                            <p className="text-slate-800 font-medium">{pedido.cliente_direccion || "Sin dirección"}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Método de Pago</p>
                                        <p className="text-slate-800 font-medium capitalize">
                                            {pedido.metodo_pago}
                                            {pedido.metodo_pago === "efectivo" && pedido.cambio && (
                                                <span className="text-xs text-slate-500 block">
                                                    (Cambio: ${parseInt(pedido.cambio).toLocaleString("es-CO")})
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(pedido.productos || []).map((prod, i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm">{prod.nombre}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {prod.cantidad} × ${parseInt(prod.precio || 0).toLocaleString("es-CO")}
                                                </p>
                                            </div>
                                            <p className="font-bold text-indigo-600 text-sm">
                                                ${(prod.cantidad * parseInt(prod.precio || 0)).toLocaleString("es-CO")}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-8 items-center">
                                    {pedido.costo_envio > 0 && (
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Envío</p>
                                            <p className="text-lg font-bold text-slate-700">
                                                ${parseInt(pedido.costo_envio).toLocaleString("es-CO")}
                                            </p>
                                        </div>
                                    )}
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total a Pagar</p>
                                        <p className="text-xl font-bold text-slate-900">
                                            ${parseInt(pedido.total || 0).toLocaleString("es-CO")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
