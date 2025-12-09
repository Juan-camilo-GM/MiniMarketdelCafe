import { IoStorefrontOutline, IoCartOutline } from "react-icons/io5";

export default function TopProducts({ topProductos }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <IoStorefrontOutline className="text-indigo-500" />
                Top 10 Productos
            </h3>
            <div className="space-y-3">
                {topProductos.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                            <IoCartOutline className="text-2xl text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-sm">No hay datos suficientes</p>
                    </div>
                ) : (
                    topProductos.map((p, i) => (
                        <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i < 3 ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                                    }`}>
                                    {i + 1}
                                </span>
                                <span className="font-medium text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{p.nombre}</span>
                            </div>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg text-xs">{p.cantidad} und</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
