import { IoCubeOutline, IoLayersOutline } from "react-icons/io5";

export default function GastosTopProductos({ topProductos }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <IoCubeOutline className="text-indigo-500" />
            Productos Más Surtidos
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Artículos con mayor volumen comprado a proveedores
          </p>
        </div>
      </div>

      {topProductos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 text-center">
          <IoLayersOutline size={32} className="mb-2 text-slate-300" />
          <p className="text-sm font-medium">No hay registros de productos en este periodo</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
          {topProductos.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                  #{index + 1}
                </div>
                <div className="truncate">
                  <p className="font-semibold text-slate-800 text-sm truncate">
                    {item.nombre}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.cantidad} {item.cantidad === 1 ? "unidad" : "unidades"} surtidas
                  </p>
                </div>
              </div>

              {item.inversion > 0 && (
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-indigo-600">
                    ${Number(item.inversion).toLocaleString("es-CO")}
                  </p>
                  <p className="text-[10px] text-slate-400">Inversión total</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
