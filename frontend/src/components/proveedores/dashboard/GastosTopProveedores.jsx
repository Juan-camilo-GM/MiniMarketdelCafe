import { IoBusinessOutline, IoPieChartOutline } from "react-icons/io5";

export default function GastosTopProveedores({ topProveedores, totalPeriodo }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <IoPieChartOutline className="text-rose-500" />
            Compras por Proveedor
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribución del gasto en el periodo seleccionado
          </p>
        </div>
      </div>

      {topProveedores.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 text-center">
          <IoBusinessOutline size={32} className="mb-2 text-slate-300" />
          <p className="text-sm font-medium">No hay compras a proveedores en este periodo</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto max-h-[360px] pr-1">
          {topProveedores.map((prov, index) => {
            const porcentaje = totalPeriodo > 0
              ? Math.min(100, Math.round((prov.total / totalPeriodo) * 100))
              : 0;

            const coloresBarra = [
              "bg-rose-500",
              "bg-indigo-500",
              "bg-purple-500",
              "bg-amber-500",
              "bg-emerald-500",
              "bg-sky-500",
            ];
            const color = coloresBarra[index % coloresBarra.length];

            return (
              <div key={prov.id || index} className="space-y-1.5 group">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-700 truncate group-hover:text-rose-600 transition-colors">
                      {prov.nombre}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      ({prov.cantidadPedidos} {prov.cantidadPedidos === 1 ? "pedido" : "pedidos"})
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-800">
                      ${Number(prov.total).toLocaleString("es-CO")}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold ml-2">
                      {porcentaje}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
