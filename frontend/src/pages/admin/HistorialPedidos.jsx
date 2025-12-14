import { useState, useMemo, useEffect } from "react";
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  IoCartOutline,
  IoStorefrontOutline,
  IoDownloadOutline,
  IoTrashBin,
  IoStatsChartOutline,
  IoListOutline,
  IoMenu,
  IoClose
} from "react-icons/io5";
import toast from "react-hot-toast";

// Hooks
import { useDashboardData } from "../../hooks/useDashboardData";
import { useOrderActions } from "../../hooks/useOrderActions";

// Components
import StatsCards from "../../components/admin/dashboard/StatsCards";
import SalesChart from "../../components/admin/dashboard/SalesChart";
import DashboardFilters from "../../components/admin/dashboard/DashboardFilters";
import TopProducts from "../../components/admin/dashboard/TopProducts";
import OrdersTable from "../../components/admin/dashboard/OrdersTable";
import LowStockAlerts from "../../components/admin/dashboard/LowStockAlerts";
import ProveedoresDashboard from "../../components/proveedores/ProveedoresDashboard";

export default function HistorialPedidos() {
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

  const renderContent = () => {
    switch (tabActivo) {
      case "resumen":
        return (
          <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Date Filter Section */}
            <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm md:text-base mb-3">
                <IoStatsChartOutline className="text-indigo-500" />
                Periodo de Análisis
              </h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex-1">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Desde:</span>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-700 outline-none w-full"
                  />
                </div>
                <span className="text-slate-300 hidden sm:inline">—</span>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex-1">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Hasta:</span>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-700 outline-none w-full"
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
        );

      case "pedidos":
        return (
          <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Focused view for operations */}
            {/* Focused view for operations */}
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
        );

      case "proveedores":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProveedoresDashboard />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-2 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-3 md:mb-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Comercial</h1>
            <p className="text-lg text-slate-500 mt-1">
              {tabActivo === "resumen" && "Visión general del desempeño del negocio"}
              {tabActivo === "pedidos" && "Gestión de órdenes y despachos"}
              {tabActivo === "proveedores" && "Administración de proveedores y surtido"}
            </p>
          </div>
          {tabActivo === "pedidos" && (
            <button
              onClick={exportarCSV}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            >
              <IoDownloadOutline size={20} />
              Exportar CSV
            </button>
          )}
        </div>

        {/* Tabs Container */}
        <div className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-100 overflow-hidden">

          {/* Mobile Menu Header */}
          <div className="md:hidden p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              {tabActivo === 'resumen' && <><IoStatsChartOutline className="text-indigo-600" size={22} /> Resumen</>}
              {tabActivo === 'pedidos' && <><IoListOutline className="text-indigo-600" size={22} /> Pedidos</>}
              {tabActivo === 'proveedores' && <><IoStorefrontOutline className="text-indigo-600" size={22} /> Proveedores</>}
            </span>
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {menuAbierto ? <IoClose size={26} /> : <IoMenu size={26} />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {menuAbierto && (
            <div className="md:hidden flex flex-col bg-white border-b border-slate-100 animate-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => { setTabActivo("resumen"); setMenuAbierto(false); }}
                className={`p-4 text-left font-medium border-l-4 transition-all flex items-center gap-3 ${tabActivo === "resumen" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-transparent text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <IoStatsChartOutline size={20} /> Resumen
              </button>
              <button
                onClick={() => { setTabActivo("pedidos"); setMenuAbierto(false); }}
                className={`p-4 text-left font-medium border-l-4 transition-all flex items-center gap-3 ${tabActivo === "pedidos" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-transparent text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <IoListOutline size={20} /> Pedidos
              </button>
              <button
                onClick={() => { setTabActivo("proveedores"); setMenuAbierto(false); }}
                className={`p-4 text-left font-medium border-l-4 transition-all flex items-center gap-3 ${tabActivo === "proveedores" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-transparent text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <IoStorefrontOutline size={20} /> Proveedores
              </button>
            </div>
          )}

          {/* Desktop Tabs */}
          <div className="hidden md:flex border-b border-slate-100 overflow-x-auto">
            <button
              onClick={() => setTabActivo("resumen")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all relative min-w-[150px] ${tabActivo === "resumen"
                ? "text-indigo-600 bg-indigo-50/50"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <IoStatsChartOutline size={20} />
                Resumen
              </div>
              {tabActivo === "resumen" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>

            <button
              onClick={() => setTabActivo("pedidos")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all relative min-w-[150px] ${tabActivo === "pedidos"
                ? "text-indigo-600 bg-indigo-50/50"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <IoListOutline size={20} />
                Pedidos
              </div>
              {tabActivo === "pedidos" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>

            <button
              onClick={() => setTabActivo("proveedores")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all relative min-w-[150px] ${tabActivo === "proveedores"
                ? "text-indigo-600 bg-indigo-50/50"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <IoStorefrontOutline size={20} />
                Proveedores
              </div>
              {tabActivo === "proveedores" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          </div>

          <div className="p-3 md:p-6 bg-slate-50/30 min-h-[500px]">
            {renderContent()}
          </div>
        </div>

        {/* Modal Eliminar */}
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
    </div>
  );
}