import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { IoListOutline, IoDownloadOutline, IoTrashBin } from "react-icons/io5";

import { useDashboardData } from "../../hooks/useDashboardData";
import { useOrderActions } from "../../hooks/useOrderActions";
import DashboardFilters from "../../components/admin/dashboard/DashboardFilters";
import OrdersTable from "../../components/admin/dashboard/OrdersTable";

export default function Pedidos() {
  const { pedidos, fetchPedidos, fetchProductosStockBajo } = useDashboardData("ventas");
  const { actualizarEstado, eliminarPedido: eliminarPedidoAction } = useOrderActions(
    fetchPedidos,
    fetchProductosStockBajo
  );

  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [fechaInicio, setFechaInicio] = useState(format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"));
  const [fechaFin, setFechaFin] = useState(format(new Date(), "yyyy-MM-dd"));
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 12;
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const datosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const fecha = format(new Date(p.created_at), "yyyy-MM-dd");
      const enRango = fecha >= fechaInicio && fecha <= fechaFin;
      const cliente = p.cliente_nombre?.toLowerCase().includes(filtro.toLowerCase());
      const estado = estadoFiltro === "" || p.estado === estadoFiltro;
      return enRango && cliente && estado;
    });
  }, [pedidos, filtro, estadoFiltro, fechaInicio, fechaFin]);

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
    link.setAttribute("download", `pedidos_${fechaInicio}_a_${fechaFin}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmarEliminacion = async () => {
    if (!pedidoAEliminar) return;
    await eliminarPedidoAction(pedidoAEliminar);
    setPedidoAEliminar(null);
  };

  const totalPaginas = Math.ceil(datosFiltrados.length / itemsPorPagina);
  const pedidosPaginados = datosFiltrados.slice((pagina - 1) * itemsPorPagina, pagina * itemsPorPagina);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-3 md:mb-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <IoListOutline className="text-indigo-600" /> Historial de Pedidos
          </h1>
          <p className="text-lg text-slate-500 mt-1">Gestión de órdenes y despachos de clientes</p>
        </div>
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5"
        >
          <IoDownloadOutline size={20} />
          Exportar CSV
        </button>
      </div>

      <div className="space-y-6">
        <DashboardFilters
          filtro={filtro}
          setFiltro={setFiltro}
          estadoFiltro={estadoFiltro}
          setEstadoFiltro={setEstadoFiltro}
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
        />

        <OrdersTable
          pedidos={pedidosPaginados}
          onEstadoChange={actualizarEstado}
          onEliminar={setPedidoAEliminar}
          onExport={exportarCSV}
          pagina={pagina}
          setPagina={setPagina}
          totalPaginas={totalPaginas}
          totalResultados={datosFiltrados.length}
          itemsPorPagina={itemsPorPagina}
        />
      </div>

      {pedidoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <IoTrashBin size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Pedido?</h3>
              <p className="text-slate-500 mb-6">
                Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este pedido permanentemente?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPedidoAEliminar(null)}
                  className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminacion}
                  className="py-3 px-4 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
