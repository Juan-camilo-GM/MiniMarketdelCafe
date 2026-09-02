import {
  IoCardOutline,
  IoReceiptOutline,
  IoTimeOutline,
  IoCalculatorOutline,
  IoBusinessOutline,
} from "react-icons/io5";

export default function GastosStatsCards({
  gastosPeriodo,
  gastosPendientes,
  pedidosPendientesCount,
  facturasPeriodo,
  facturasCount,
  promedioGasto,
  proveedoresActivosCount,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* 1. Total Gastos en Pedidos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Gastos en Pedidos
            </p>
            <p className="text-2xl md:text-3xl font-black text-rose-600 group-hover:scale-105 transition-transform origin-left">
              ${Number(gastosPeriodo || 0).toLocaleString("es-CO")}
            </p>
            <p className="text-xs font-medium text-slate-500">
              En el periodo seleccionado
            </p>
          </div>
          <div className="p-3.5 bg-rose-50 rounded-2xl group-hover:bg-rose-100 transition-colors">
            <IoCardOutline className="text-2xl md:text-3xl text-rose-600" />
          </div>
        </div>
      </div>

      {/* 2. Total Facturas Registradas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Facturado
            </p>
            <p className="text-2xl md:text-3xl font-black text-purple-600 group-hover:scale-105 transition-transform origin-left">
              ${Number(facturasPeriodo || 0).toLocaleString("es-CO")}
            </p>
            <p className="text-xs font-medium text-slate-500">
              {facturasCount || 0} facturas en el periodo
            </p>
          </div>
          <div className="p-3.5 bg-purple-50 rounded-2xl group-hover:bg-purple-100 transition-colors">
            <IoReceiptOutline className="text-2xl md:text-3xl text-purple-600" />
          </div>
        </div>
      </div>

      {/* 3. Gasto Promedio por Pedido */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Promedio por Pedido
            </p>
            <p className="text-2xl md:text-3xl font-black text-indigo-600 group-hover:scale-105 transition-transform origin-left">
              ${Number(promedioGasto || 0).toLocaleString("es-CO")}
            </p>
            <p className="text-xs font-medium text-slate-500">
              {proveedoresActivosCount || 0} proveedores con compras
            </p>
          </div>
          <div className="p-3.5 bg-indigo-50 rounded-2xl group-hover:bg-indigo-100 transition-colors">
            <IoCalculatorOutline className="text-2xl md:text-3xl text-indigo-600" />
          </div>
        </div>
      </div>

      {/* 4. Pedidos Pendientes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pedidos Pendientes
            </p>
            <p className="text-2xl md:text-3xl font-black text-amber-500 group-hover:scale-105 transition-transform origin-left">
              {pedidosPendientesCount || 0}
            </p>
            <p className="text-xs font-medium text-amber-600 font-semibold">
              ${Number(gastosPendientes || 0).toLocaleString("es-CO")} por recibir
            </p>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-2xl group-hover:bg-amber-100 transition-colors">
            <IoTimeOutline className="text-2xl md:text-3xl text-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
