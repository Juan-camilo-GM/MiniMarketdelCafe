import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoTrashBin,
  IoSearch,
  IoCalendarOutline,
  IoPersonOutline,
  IoCashOutline,
  IoTrendingUp,
  IoCartOutline,
  IoTimeOutline,
  IoDownloadOutline,
} from "react-icons/io5";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ← NUEVO COMPONENTE: Fila expandible con detalle de productos
const PedidoRow = ({ pedido, onEstadoChange, onEliminar }) => {
  const [expandido, setExpandido] = useState(false);

  return (
    <>
      {/* Fila principal - clickable */}
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-all"
        onClick={() => setExpandido(!expandido)}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-400">
              {expandido ? "▼" : <IoPersonOutline />}
            </span>
            <div>
              <p className="font-medium">{pedido.cliente_nombre || "Sin nombre"}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(pedido.created_at), "d MMM yyyy • HH:mm", { locale: es })}
              </p>
            </div>
          </div>
        </td>
        <td className="px-5 py-4 font-bold text-indigo-600">
          ${parseInt(pedido.total || 0).toLocaleString("es-CO")}
        </td>
        <td className="px-5 py-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              pedido.estado === "confirmado"
                ? "bg-emerald-100 text-emerald-800"
                : pedido.estado === "pendiente"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {pedido.estado?.toUpperCase() || "SIN ESTADO"}
          </span>
        </td>
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            {pedido.estado !== "confirmado" && (
              <button
                onClick={() => onEstadoChange(pedido.id, "confirmado")}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <IoCheckmarkCircle size={19} />
              </button>
            )}
            {pedido.estado !== "cancelado" && (
              <button
                onClick={() => onEstadoChange(pedido.id, "cancelado")}
                className="text-rose-600 hover:text-rose-800"
              >
                <IoCloseCircle size={19} />
              </button>
            )}
            <button
              onClick={() => onEliminar(pedido.id)}
              className="text-gray-600 hover:text-gray-800"
            >
              <IoTrashBin size={18} />
            </button>
          </div>
        </td>
      </tr>

      {/* Fila expandida con productos */}
      {expandido && (
        <tr>
          <td colSpan="4" className="px-5 py-6 bg-gray-50 border-t">
            <div className="max-w-5xl mx-auto">
              <h4 className="font-semibold text-gray-800 mb-4">
                Productos comprados ({pedido.productos?.length || 0})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(pedido.productos || []).map((prod, i) => (
                  <div
                    key={i}
                    className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm hover:shadow-md transition"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{prod.nombre}</p>
                      <p className="text-sm text-gray-600">
                        {prod.cantidad} × ${parseInt(prod.precio || 0).toLocaleString("es-CO")}
                      </p>
                    </div>
                    <p className="font-bold text-indigo-600">
                      ${(prod.cantidad * parseInt(prod.precio || 0)).toLocaleString("es-CO")}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 text-right border-t pt-3">
                <span className="text-lg font-bold text-gray-800">
                  Total del pedido: ${parseInt(pedido.total || 0).toLocaleString("es-CO")}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default function DashboardPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [fechaInicio, setFechaInicio] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [fechaFin, setFechaFin] = useState(format(new Date(), "yyyy-MM-dd"));
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 12;

  // Cargar pedidos
  const fetchPedidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error cargando pedidos:", error);
    else setPedidos(data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  // Acciones
  const actualizarEstado = async (id, nuevoEstado) => {
    await supabase.from("pedidos").update({ estado: nuevoEstado }).eq("id", id);
    fetchPedidos();
  };

  const eliminarPedido = async (id) => {
    if (!window.confirm("¿Eliminar este pedido permanentemente?")) return;
    await supabase.from("pedidos").delete().eq("id", id);
    fetchPedidos();
  };

  // Filtrado
  const datosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const fecha = format(new Date(p.created_at), "yyyy-MM-dd");
      const enRango = fecha >= fechaInicio && fecha <= fechaFin;
      const cliente = p.cliente_nombre?.toLowerCase().includes(filtro.toLowerCase());
      const estado = estadoFiltro === "" || p.estado === estadoFiltro;
      return enRango && cliente && estado;
    });
  }, [pedidos, filtro, estadoFiltro, fechaInicio, fechaFin]);

  // Métricas clave
  const hoy = format(new Date(), "yyyy-MM-dd");
  const ventasHoy = datosFiltrados
    .filter((p) => format(new Date(p.created_at), "yyyy-MM-dd") === hoy && p.estado === "confirmado")
    .reduce((acc, p) => acc + parseInt(p.total || 0), 0);

  const ventasPeriodo = datosFiltrados
    .filter((p) => p.estado === "confirmado")
    .reduce((acc, p) => acc + parseInt(p.total || 0), 0);

  const pedidosPendientes = datosFiltrados.filter((p) => p.estado === "pendiente").length;

  const pedidosConfirmados = datosFiltrados.filter((p) => p.estado === "confirmado").length;
  const ticketPromedio = pedidosConfirmados > 0 ? Math.round(ventasPeriodo / pedidosConfirmados) : 0;

  // Gráfico últimos 7 días
  const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
    const fecha = subDays(new Date(), 6 - i);
    const fechaStr = format(fecha, "yyyy-MM-dd");
    const ventas = datosFiltrados
      .filter((p) => format(new Date(p.created_at), "yyyy-MM-dd") === fechaStr && p.estado === "confirmado")
      .reduce((acc, p) => acc + parseInt(p.total || 0), 0);

    return {
      dia: format(fecha, "EEE", { locale: es }),
      fecha: format(fecha, "d MMM", { locale: es }),
      ventas,
    };
  });

  // Top 5 productos
  const topProductos = useMemo(() => {
    const mapa = {};
    datosFiltrados.forEach((p) => {
      if (p.estado !== "confirmado") return;
      p.productos?.forEach((prod) => {
        mapa[prod.nombre] = (mapa[prod.nombre] || 0) + prod.cantidad;
      });
    });
    return Object.entries(mapa)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));
  }, [datosFiltrados]);

  // Exportar CSV sin dependencias externas
  const exportarCSV = () => {
    const encabezado = ["Fecha", "Cliente", "Estado", "Total", "Productos"];
    const filas = datosFiltrados.map((p) => [
      format(new Date(p.created_at), "dd/MM/yyyy HH:mm"),
      p.cliente_nombre,
      p.estado.toUpperCase(),
      parseInt(p.total),
      p.productos?.map((pr) => `${pr.nombre} x${pr.cantidad}`).join(" | ") || "",
    ]);

    const csvContent = [
      encabezado.join(","),
      ...filas.map((fila) => fila.map((campo) => `"${campo}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ventas_${fechaInicio}_a_${fechaFin}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Paginación
  const totalPaginas = Math.ceil(datosFiltrados.length / itemsPorPagina);
  const pedidosPaginados = datosFiltrados.slice((pagina - 1) * itemsPorPagina, pagina * itemsPorPagina);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header + Exportar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Dashboard de Ventas</h1>
            <p className="text-lg text-gray-600">Minimercado • Control total de pedidos y ganancias</p>
          </div>
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-lg"
          >
            <IoDownloadOutline size={20} />
            Exportar CSV
          </button>
        </div>

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas hoy</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">
                  ${ventasHoy.toLocaleString("es-CO")}
                </p>
              </div>
              <IoTrendingUp className="text-5xl text-emerald-200 opacity-70" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total período</p>
                <p className="text-3xl font-black text-indigo-600 mt-1">
                  ${ventasPeriodo.toLocaleString("es-CO")}
                </p>
              </div>
              <IoCashOutline className="text-5xl text-indigo-200 opacity-70" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos pendientes</p>
                <p className="text-3xl font-black text-amber-600 mt-1">{pedidosPendientes}</p>
              </div>
              <IoTimeOutline className="text-5xl text-amber-200 opacity-70" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket promedio</p>
                <p className="text-3xl font-black text-purple-600 mt-1">
                  ${ticketPromedio.toLocaleString("es-CO")}
                </p>
              </div>
              <IoCartOutline className="text-5xl text-purple-200 opacity-70" />
            </div>
          </div>
        </div>

        {/* Filtros + Gráfico */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border space-y-5">
            <h3 className="text-xl font-bold text-gray-800">Filtros</h3>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="px-4 py-3 border rounded-xl" />
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="px-4 py-3 border rounded-xl" />
            </div>
          </div>

          <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg p-6 border">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ventas últimos 7 días</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ultimos7Dias}>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString("es-CO")}`} />
                <Bar dataKey="ventas" fill="#6366f1" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top productos + Tabla */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Top 5 productos</h3>
            <div className="space-y-3">
              {topProductos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay ventas confirmadas</p>
              ) : (
                topProductos.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="font-medium">{i + 1}. {p.nombre}</span>
                    <span className="font-bold text-indigo-600">{p.cantidad} und</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TABLA MEJORADA CON DETALLE EXPANDIBLE */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Pedidos recientes ({datosFiltrados.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-700">Cliente / Fecha</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-700">Total</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-700">Estado</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pedidosPaginados.map((p) => (
                    <PedidoRow
                      key={p.id}
                      pedido={p}
                      onEstadoChange={actualizarEstado}
                      onEliminar={eliminarPedido}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Mostrando {(pagina - 1) * itemsPorPagina + 1}–{Math.min(pagina * itemsPorPagina, datosFiltrados.length)} de {datosFiltrados.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}