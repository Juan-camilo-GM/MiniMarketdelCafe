import { useState, useMemo, useEffect } from "react";
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  IoStorefrontOutline,
  IoDownloadOutline,
  IoTrashBin,
  IoStatsChartOutline,
  IoListOutline,
  IoMenu,
  IoClose
} from "react-icons/io5";

// Hooks
import { useDashboardData } from "../../hooks/useDashboardData";
import { useOrderActions } from "../../hooks/useOrderActions";

// Components
import StatsCards from "../../components/admin/dashboard/StatsCards";
import SalesChart from "../../components/admin/dashboard/SalesChart";
import TopProducts from "../../components/admin/dashboard/TopProducts";
import LowStockAlerts from "../../components/admin/dashboard/LowStockAlerts";

export default function Dashboard() {
  // Tabs state: 'resumen', 'pedidos', 'proveedores'
  const [tabActivo, setTabActivo] = useState("resumen");
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Custom Hooks
  // We need data for both "resumen" and "pedidos", so we treat them as "ventas" context
  const isVentasContext = tabActivo === "resumen" || tabActivo === "pedidos";

  const {
    pedidos,
    productosStockBajo,
    loading,
    loadingStock,
    fetchPedidos,
    fetchProductosStockBajo
  } = useDashboardData(isVentasContext ? "ventas" : "proveedores");

  const { actualizarEstado, eliminarPedido: eliminarPedidoAction } = useOrderActions(
    fetchPedidos,
    fetchProductosStockBajo
  );

  // Filters State
  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [fechaInicio, setFechaInicio] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [fechaFin, setFechaFin] = useState(format(new Date(), "yyyy-MM-dd"));

  // Pagination State
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 12;

  // Modal State
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null);

  // Load data when tab changes or is in ventas context
  useEffect(() => {
    if (isVentasContext) {
      fetchPedidos();
      fetchProductosStockBajo();
    }
  }, [isVentasContext, fetchPedidos, fetchProductosStockBajo]);

  // Calculations & Filtering
  const datosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const fecha = format(new Date(p.created_at), "yyyy-MM-dd");
      const enRango = fecha >= fechaInicio && fecha <= fechaFin;
      // In resumen tab, we ignore text/status filters for the overview metrics
      // But acts as global filter if we want consistency. 
      // For now, let's keep it consistent: filters apply to "Ventas" tab specifically,
      // but Date Range applies to everything in "Resumen".
      // Actually, for Resumen, we usually only care about Date.
      if (tabActivo === "resumen") return enRango;

      const cliente = p.cliente_nombre?.toLowerCase().includes(filtro.toLowerCase());
      const estado = estadoFiltro === "" || p.estado === estadoFiltro;
      return enRango && cliente && estado;
    });
  }, [pedidos, filtro, estadoFiltro, fechaInicio, fechaFin, tabActivo]);

  const stats = useMemo(() => {
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
    const productosStockCritico = productosStockBajo.filter(p => p.stock <= 5).length;
    const productosAgotados = productosStockBajo.filter(p => p.stock === 0).length;

    return {
      ventasHoy,
      ventasPeriodo,
      pedidosPendientes,
      ticketPromedio,
      stockBajoCount: productosStockBajo.length,
      agotadosCount: productosAgotados,
      criticosCount: productosStockCritico
    };
  }, [datosFiltrados, productosStockBajo]);

  const chartData = useMemo(() => {
    if (!fechaInicio || !fechaFin) return [];

    try {
      // Create dates using local time to avoid UTC shift issues
      const [startYear, startMonth, startDay] = fechaInicio.split('-').map(Number);
      const [endYear, endMonth, endDay] = fechaFin.split('-').map(Number);

      const start = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);

      const days = eachDayOfInterval({ start, end });

      return days.map((day) => {
        const fechaStr = format(day, "yyyy-MM-dd");
        const ventas = datosFiltrados
          .filter((p) => {
            // Robust comparison: check if the order date (local) is the same day as the chart bucket day
            const orderDate = parseISO(p.created_at);
            return isSameDay(orderDate, day) && p.estado === "confirmado";
          })
          .reduce((acc, p) => acc + parseInt(p.total || 0), 0);

        return {
          dia: format(day, "EEE", { locale: es }), // Lun
          fecha: format(day, "d MMM", { locale: es }), // 12 Dic
          fechaFull: fechaStr,
          ventas,
        };
      });
    } catch (e) {
      console.error("Error generating chart data", e);
      return [];
    }
  }, [datosFiltrados, fechaInicio, fechaFin]);

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
      .slice(0, 10)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));
  }, [datosFiltrados]);

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

  const confirmarEliminacion = async () => {
    if (!pedidoAEliminar) return;
    await eliminarPedidoAction(pedidoAEliminar);
    setPedidoAEliminar(null);
  };

  // Pagination Logic
  const totalPaginas = Math.ceil(datosFiltrados.length / itemsPorPagina);
  const pedidosPaginados = datosFiltrados.slice((pagina - 1) * itemsPorPagina, pagina * itemsPorPagina);

  if (loading && isVentasContext) {
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
    <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-3 md:mb-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <IoStatsChartOutline className="text-indigo-600" /> Dashboard Comercial
            </h1>
            <p className="text-lg text-slate-500 mt-1">
              Visión general del desempeño del negocio
            </p>
          </div>
        </div>

        <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Date Filter Section */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <IoStatsChartOutline className="text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">Periodo de Análisis</h3>
                  <p className="text-xs text-slate-500">Filtra las métricas por fecha</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50/80 p-1.5 rounded-xl border border-slate-100 w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 flex-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Desde</span>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer text-right sm:text-left w-full sm:w-auto"
                  />
                </div>
                <span className="hidden sm:inline text-slate-300 font-bold">—</span>
                <div className="flex items-center justify-between sm:justify-start gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 flex-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hasta</span>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer text-right sm:text-left w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-8">
              {/* KPIs & Chart take prominence */}
              <div className="xl:col-span-3">
                <StatsCards
                  ventasHoy={stats.ventasHoy}
                  ventasPeriodo={stats.ventasPeriodo}
                  pedidosPendientes={stats.pedidosPendientes}
                  ticketPromedio={stats.ticketPromedio}
                  stockBajoCount={stats.stockBajoCount}
                  agotadosCount={stats.agotadosCount}
                />
              </div>

              <div className="xl:col-span-2 space-y-4 md:space-y-8">
                <SalesChart data={chartData} />
                <TopProducts topProductos={topProductos} />
              </div>

              <div className="xl:col-span-1">
                <LowStockAlerts productos={productosStockBajo} loading={loadingStock} />
              </div>
            </div>
        </div>

      </div>
  );
}