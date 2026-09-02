import { useState, useMemo } from "react";
import {
  format,
  subDays,
  subMonths,
  startOfMonth,
  startOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  IoStatsChartOutline,
  IoDownloadOutline,
  IoFilterOutline,
  IoCalendarOutline,
  IoRefreshOutline,
} from "react-icons/io5";

import {
  parseDateSafe,
  formatColombiaDate,
  formatColombiaDateTime,
  getTodayDateString,
} from "../../../lib/dateUtils";

import GastosStatsCards from "./GastosStatsCards";
import GastosChart from "./GastosChart";
import GastosTopProveedores from "./GastosTopProveedores";
import GastosTopProductos from "./GastosTopProductos";

export default function GastosDashboard({
  pedidosProveedor = [],
  facturas = [],
  proveedores = [],
  onRefresh,
}) {
  // Rango de fechas: por defecto últimos 6 meses para ver mes a mes de inmediato
  const [fechaInicio, setFechaInicio] = useState(() =>
    format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd")
  );
  const [fechaFin, setFechaFin] = useState(() => getTodayDateString());

  // Configuración de visualización
  const [agrupacion, setAgrupacion] = useState("mes"); // "mes" | "dia"
  const [filtroProveedorId, setFiltroProveedorId] = useState("");
  const [incluirFacturas, setIncluirFacturas] = useState(true);

  // Preset selectors
  const aplicarPreset = (tipo) => {
    const hoy = new Date();
    switch (tipo) {
      case "30dias":
        setFechaInicio(format(subDays(hoy, 30), "yyyy-MM-dd"));
        setFechaFin(format(hoy, "yyyy-MM-dd"));
        setAgrupacion("dia");
        break;
      case "esteMes":
        setFechaInicio(format(startOfMonth(hoy), "yyyy-MM-dd"));
        setFechaFin(format(hoy, "yyyy-MM-dd"));
        setAgrupacion("dia");
        break;
      case "ultimos3Meses":
        setFechaInicio(format(startOfMonth(subMonths(hoy, 2)), "yyyy-MM-dd"));
        setFechaFin(format(hoy, "yyyy-MM-dd"));
        setAgrupacion("mes");
        break;
      case "ultimos6Meses":
        setFechaInicio(format(startOfMonth(subMonths(hoy, 5)), "yyyy-MM-dd"));
        setFechaFin(format(hoy, "yyyy-MM-dd"));
        setAgrupacion("mes");
        break;
      case "esteAno":
        setFechaInicio(format(startOfYear(hoy), "yyyy-MM-dd"));
        setFechaFin(format(hoy, "yyyy-MM-dd"));
        setAgrupacion("mes");
        break;
      case "historico":
        setFechaInicio("2024-01-01");
        setFechaFin(format(hoy, "yyyy-MM-dd"));
        setAgrupacion("mes");
        break;
      default:
        break;
    }
  };

  // Filtrado de pedidos en el periodo
  const pedidosFiltrados = useMemo(() => {
    return pedidosProveedor.filter((p) => {
      const fecha = formatColombiaDate(p.created_at, "yyyy-MM-dd");
      const enRango = fecha >= fechaInicio && fecha <= fechaFin;
      const cumpleProveedor = !filtroProveedorId || p.proveedor_id === filtroProveedorId;
      return enRango && cumpleProveedor;
    });
  }, [pedidosProveedor, fechaInicio, fechaFin, filtroProveedorId]);

  // Filtrado de facturas en el periodo
  const facturasFiltradas = useMemo(() => {
    return facturas.filter((f) => {
      const fecha = formatColombiaDate(f.fecha, "yyyy-MM-dd");
      const enRango = fecha >= fechaInicio && fecha <= fechaFin;
      const cumpleProveedor = !filtroProveedorId || f.proveedor_id === filtroProveedorId;
      return enRango && cumpleProveedor;
    });
  }, [facturas, fechaInicio, fechaFin, filtroProveedorId]);

  // KPIs / Métricas
  const stats = useMemo(() => {
    const pedidosConfirmados = pedidosFiltrados.filter(
      (p) => p.estado === "confirmado" || p.estado === "recibido"
    );
    const pedidosPendientes = pedidosFiltrados.filter((p) => p.estado === "pendiente");

    const gastosPeriodo = pedidosConfirmados.reduce(
      (acc, p) => acc + (parseFloat(p.total) || 0),
      0
    );
    const gastosPendientes = pedidosPendientes.reduce(
      (acc, p) => acc + (parseFloat(p.total) || 0),
      0
    );
    const facturasPeriodo = facturasFiltradas.reduce(
      (acc, f) => acc + (parseFloat(f.monto) || 0),
      0
    );

    const promedioGasto =
      pedidosConfirmados.length > 0
        ? Math.round(gastosPeriodo / pedidosConfirmados.length)
        : 0;

    // Proveedores únicos con compras o facturas en este periodo
    const provIds = new Set();
    pedidosFiltrados.forEach((p) => {
      if (p.proveedor_id) provIds.add(p.proveedor_id);
    });
    facturasFiltradas.forEach((f) => {
      if (f.proveedor_id) provIds.add(f.proveedor_id);
    });

    return {
      gastosPeriodo,
      gastosPendientes,
      pedidosPendientesCount: pedidosPendientes.length,
      facturasPeriodo,
      facturasCount: facturasFiltradas.length,
      promedioGasto,
      proveedoresActivosCount: provIds.size,
    };
  }, [pedidosFiltrados, facturasFiltradas]);

  // Generación de datos para la gráfica (Mes a Mes o Día a Día)
  const chartData = useMemo(() => {
    if (!fechaInicio || !fechaFin || fechaInicio > fechaFin) return [];

    try {
      const [sYear, sMonth, sDay] = fechaInicio.split("-").map(Number);
      const [eYear, eMonth, eDay] = fechaFin.split("-").map(Number);

      const start = new Date(sYear, sMonth - 1, sDay);
      const end = new Date(eYear, eMonth - 1, eDay);

      if (agrupacion === "mes") {
        const months = eachMonthOfInterval({ start, end });

        return months.map((monthDate) => {
          const mesKey = format(monthDate, "yyyy-MM");
          const label = format(monthDate, "MMM yyyy", { locale: es });
          const labelCapitalized = label.charAt(0).toUpperCase() + label.slice(1);

          // Gastos en pedidos de este mes
          const gastosPedidos = pedidosFiltrados
            .filter((p) => {
              const pDate = parseDateSafe(p.created_at);
              const esMismoMes = isSameMonth(pDate, monthDate);
              const esConfirmado = p.estado === "confirmado" || p.estado === "recibido";
              return esMismoMes && esConfirmado;
            })
            .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);

          // Facturas de este mes
          const gastosFacturas = facturasFiltradas
            .filter((f) => {
              const fDate = parseDateSafe(f.fecha);
              return isSameMonth(fDate, monthDate);
            })
            .reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);

          return {
            key: mesKey,
            label: labelCapitalized,
            periodoLabel: format(monthDate, "MMMM yyyy", { locale: es }),
            gastosPedidos,
            gastosFacturas,
            totalCombinado: gastosPedidos + gastosFacturas,
          };
        });
      } else {
        // Agrupación día a día
        const days = eachDayOfInterval({ start, end });

        return days.map((dayDate) => {
          const diaKey = format(dayDate, "yyyy-MM-dd");
          const label = format(dayDate, "d MMM", { locale: es });

          const gastosPedidos = pedidosFiltrados
            .filter((p) => {
              const pDate = parseDateSafe(p.created_at);
              const esMismoDia = isSameDay(pDate, dayDate);
              const esConfirmado = p.estado === "confirmado" || p.estado === "recibido";
              return esMismoDia && esConfirmado;
            })
            .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);

          const gastosFacturas = facturasFiltradas
            .filter((f) => {
              const fDate = parseDateSafe(f.fecha);
              return isSameDay(fDate, dayDate);
            })
            .reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);

          return {
            key: diaKey,
            label,
            periodoLabel: format(dayDate, "d 'de' MMMM, yyyy", { locale: es }),
            gastosPedidos,
            gastosFacturas,
            totalCombinado: gastosPedidos + gastosFacturas,
          };
        });
      }
    } catch (err) {
      console.error("Error generating chart data for proveedores:", err);
      return [];
    }
  }, [pedidosFiltrados, facturasFiltradas, fechaInicio, fechaFin, agrupacion]);

  // Ranking de Proveedores con mayor compra
  const topProveedores = useMemo(() => {
    const mapa = {};

    pedidosFiltrados.forEach((p) => {
      if (p.estado !== "confirmado" && p.estado !== "recibido") return;
      const provNombre = p.proveedores?.nombre || "Sin Proveedor";
      const provId = p.proveedor_id || provNombre;

      if (!mapa[provId]) {
        mapa[provId] = {
          id: provId,
          nombre: provNombre,
          total: 0,
          cantidadPedidos: 0,
        };
      }
      mapa[provId].total += parseFloat(p.total) || 0;
      mapa[provId].cantidadPedidos += 1;
    });

    return Object.values(mapa).sort((a, b) => b.total - a.total);
  }, [pedidosFiltrados]);

  // Ranking de Productos más comprados
  const topProductos = useMemo(() => {
    const mapa = {};

    pedidosFiltrados.forEach((p) => {
      if (p.estado !== "confirmado" && p.estado !== "recibido") return;
      if (Array.isArray(p.productos)) {
        p.productos.forEach((prod) => {
          const nombre = prod.nombre || "Producto";
          if (!mapa[nombre]) {
            mapa[nombre] = {
              nombre,
              cantidad: 0,
              inversion: 0,
            };
          }
          const cant = parseInt(prod.cantidad || 0);
          const subt =
            parseFloat(prod.subtotal) ||
            cant * (parseFloat(prod.precio_unitario || prod.precio) || 0);

          mapa[nombre].cantidad += cant;
          mapa[nombre].inversion += subt;
        });
      }
    });

    return Object.values(mapa)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }, [pedidosFiltrados]);

  // Exportar reporte de gastos a CSV
  const exportarGastosCSV = () => {
    const lineas = [];
    lineas.push(["Fecha", "Tipo", "Proveedor", "Referencia/ID", "Estado", "Total ($)", "Detalle/Productos"]);

    // Agregar pedidos
    pedidosFiltrados.forEach((p) => {
      const fecha = formatColombiaDateTime(p.created_at, "dd/MM/yyyy HH:mm");
      const tipo = "Pedido Proveedor";
      const proveedor = p.proveedores?.nombre || "N/A";
      const idRef = `#${p.id}`;
      const estado = p.estado?.toUpperCase() || "";
      const total = parseInt(p.total || 0);
      const detalle =
        p.productos?.map((pr) => `${pr.nombre} x${pr.cantidad}`).join(" | ") ||
        p.descripcion ||
        "";

      lineas.push([fecha, tipo, proveedor, idRef, estado, total, detalle]);
    });

    // Agregar facturas
    facturasFiltradas.forEach((f) => {
      const fecha = formatColombiaDate(f.fecha, "dd/MM/yyyy");
      const tipo = "Factura";
      const proveedor = f.proveedores?.nombre || "N/A";
      const idRef = f.numero_factura || `#${f.id}`;
      const estado = "REGISTRADA";
      const total = parseInt(f.monto || 0);
      const detalle = f.descripcion || "";

      lineas.push([fecha, tipo, proveedor, idRef, estado, total, detalle]);
    });

    const csvContent = lineas
      .map((fila) => fila.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `gastos_proveedores_${fechaInicio}_a_${fechaFin}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Barra de Filtros & Periodo de Análisis */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base md:text-lg">
              <IoStatsChartOutline className="text-rose-500" />
              Periodo de Análisis de Gastos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecciona el rango de fechas para evaluar las compras y facturación a proveedores
            </p>
          </div>

          {/* Acciones: Refrescar y Exportar */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
                title="Actualizar datos"
              >
                <IoRefreshOutline size={18} />
              </button>
            )}
            <button
              onClick={exportarGastosCSV}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 active:scale-95"
            >
              <IoDownloadOutline size={18} />
              Exportar Gastos CSV
            </button>
          </div>
        </div>

        {/* Presets Rápidos */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <IoCalendarOutline /> Rangos:
          </span>
          {[
            { id: "esteMes", label: "Este Mes" },
            { id: "30dias", label: "Últimos 30 días" },
            { id: "ultimos3Meses", label: "Últimos 3 meses" },
            { id: "ultimos6Meses", label: "Últimos 6 meses" },
            { id: "esteAno", label: "Este Año" },
            { id: "historico", label: "Histórico" },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => aplicarPreset(preset.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 hover:border-rose-200 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Inputs de Rango y Filtro por Proveedor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {/* Desde */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full"
            />
          </div>

          {/* Hasta */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full"
            />
          </div>

          {/* Filtro por Proveedor */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 sm:col-span-2 lg:col-span-1">
            <IoFilterOutline className="text-slate-400" />
            <select
              value={filtroProveedorId}
              onChange={(e) => setFiltroProveedorId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full cursor-pointer"
            >
              <option value="">Todos los proveedores ({proveedores.length})</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas del Periodo */}
      <GastosStatsCards
        gastosPeriodo={stats.gastosPeriodo}
        gastosPendientes={stats.gastosPendientes}
        pedidosPendientesCount={stats.pedidosPendientesCount}
        facturasPeriodo={stats.facturasPeriodo}
        facturasCount={stats.facturasCount}
        promedioGasto={stats.promedioGasto}
        proveedoresActivosCount={stats.proveedoresActivosCount}
      />

      {/* Gráfica Principal de Evolución de Gastos */}
      <GastosChart
        data={chartData}
        agrupacion={agrupacion}
        setAgrupacion={setAgrupacion}
        incluirFacturas={incluirFacturas}
        setIncluirFacturas={setIncluirFacturas}
      />

      {/* Desgloses: Top Proveedores y Top Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GastosTopProveedores
          topProveedores={topProveedores}
          totalPeriodo={stats.gastosPeriodo}
        />
        <GastosTopProductos topProductos={topProductos} />
      </div>
    </div>
  );
}
