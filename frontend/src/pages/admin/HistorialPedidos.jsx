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
} from "react-icons/io5";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale"; // ← Para español perfecto

export default function HistorialPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");

  const fetchPedidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setPedidos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const actualizarEstado = async (id, nuevoEstado) => {
    await supabase.from("pedidos").update({ estado: nuevoEstado }).eq("id", id);
    fetchPedidos();
  };

  const eliminarPedido = async (id) => {
    if (!window.confirm("¿Eliminar este pedido permanentemente?")) return;
    await supabase.from("pedidos").delete().eq("id", id);
    fetchPedidos();
  };

  // FILTRO 100% CORRECTO CON ZONA HORARIA COLOMBIA (UTC-5)
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      // Convertir created_at (UTC) a hora local Colombia
      const fechaUTC = parseISO(p.created_at);
      const fechaColombia = new Date(fechaUTC.getTime() - 5 * 60 * 60 * 1000);

      const clienteMatch = p.cliente_nombre
        ?.toLowerCase()
        .includes(filtro.toLowerCase());
      const estadoMatch = estadoFiltro === "" || p.estado === estadoFiltro;
      const fechaMatch =
        !fechaSeleccionada ||
        format(fechaColombia, "yyyy-MM-dd") === fechaSeleccionada;

      return clienteMatch && estadoMatch && fechaMatch;
    });
  }, [pedidos, filtro, estadoFiltro, fechaSeleccionada]);

  // Total ventas confirmadas del día seleccionado
  const totalVentasConfirmadas = pedidosFiltrados
    .filter((p) => p.estado === "confirmado")
    .reduce((acc, p) => acc + parseInt(p.total || 0), 0);

  const pedidosConfirmadosCount = pedidosFiltrados.filter(
    (p) => p.estado === "confirmado"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-2xl font-bold text-indigo-600">Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          Historial de Pedidos
        </h1>
        <p className="text-xl text-gray-600 mb-8">{pedidos.length} pedidos registrados</p>

        {/* FILTROS */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="px-5 py-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <div className="relative">
              <IoCalendarOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
              {fechaSeleccionada && (
                <button
                  onClick={() => setFechaSeleccionada("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 text-xl"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {(filtro || estadoFiltro || fechaSeleccionada) && (
            <button
              onClick={() => {
                setFiltro("");
                setEstadoFiltro("");
                setFechaSeleccionada("");
              }}
              className="mt-4 text-indigo-600 hover:underline font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* TOTAL VENTAS CONFIRMADAS EN ESPAÑOL */}
        {fechaSeleccionada && pedidosFiltrados.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-2xl shadow-2xl p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-2xl font-bold opacity-90">Ventas confirmadas del día</p>
                <p className="text-4xl font-extrabold mt-2">
                  {format(parseISO(fechaSeleccionada + "T12:00:00"), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-black">
                  ${totalVentasConfirmadas.toLocaleString("es-CO")}
                </p>
                <p className="text-xl mt-3 opacity-90">
                  {pedidosConfirmadosCount} {pedidosConfirmadosCount === 1 ? "pedido" : "pedidos"} confirmado(s)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LISTA DE PEDIDOS - TARJETAS COMPACTAS Y BONITAS */}
        <div className="space-y-6">
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg border">
              <p className="text-2xl text-gray-500 font-medium">
                {fechaSeleccionada
                  ? `No hay pedidos el ${format(parseISO(fechaSeleccionada + "T12:00:00"), "d 'de' MMMM yyyy", { locale: es })}`
                  : "No se encontraron pedidos"}
              </p>
            </div>
          ) : (
            pedidosFiltrados.map((p) => {
              const fechaColombia = new Date(new Date(p.created_at).getTime() - 5 * 60 * 60 * 1000);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-lg border hover:shadow-xl transition-shadow p-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cliente + Fecha */}
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <IoPersonOutline className="text-indigo-600" />
                        {p.cliente_nombre}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <IoCalendarOutline />
                        {format(fechaColombia, "d 'de' MMMM yyyy • HH:mm", { locale: es })}
                      </p>
                      <span
                        className={`inline-block mt-3 px-4 py-2 rounded-full text-sm font-bold
                          ${p.estado === "pendiente" ? "bg-amber-100 text-amber-800" :
                            p.estado === "confirmado" ? "bg-emerald-100 text-emerald-800" :
                            "bg-rose-100 text-rose-800"}`}
                      >
                        {p.estado.toUpperCase()}
                      </span>
                    </div>

                    {/* Productos + Total */}
                    <div>
                      <div className="space-y-2 mb-4">
                        {p.productos.map((prod, i) => (
                          <div key={i} className="bg-gray-50 rounded-lg px-4 py-2 flex justify-between text-sm">
                            <span>{prod.nombre}</span>
                            <span className="font-bold text-indigo-600">×{prod.cantidad}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <IoCashOutline className="text-2xl text-indigo-600" />
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-2xl font-black text-indigo-600">
                            ${parseInt(p.total).toLocaleString("es-CO")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col gap-3">
                      {p.estado !== "confirmado" && (
                        <button
                          onClick={() => actualizarEstado(p.id, "confirmado")}
                          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                          <IoCheckmarkCircle /> Confirmar
                        </button>
                      )}
                      {p.estado !== "cancelado" && (
                        <button
                          onClick={() => actualizarEstado(p.id, "cancelado")}
                          className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                          <IoCloseCircle /> Cancelar
                        </button>
                      )}
                      <button
                        onClick={() => eliminarPedido(p.id)}
                        className="px-5 py-3 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        <IoTrashBin /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}