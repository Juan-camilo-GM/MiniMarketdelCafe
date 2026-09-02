import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { IoTrendingDown, IoCalendarOutline } from "react-icons/io5";

const CustomGastosTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 outline-none min-w-[180px]">
        <p className="text-xs font-bold text-slate-500 mb-2 border-b border-slate-100 pb-1">
          {data.periodoLabel || label}
        </p>
        
        {payload.map((entry, idx) => (
          <div key={idx} className="flex justify-between items-center gap-4 text-xs py-0.5">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-bold text-slate-900">
              ${Number(entry.value || 0).toLocaleString("es-CO")}
            </span>
          </div>
        ))}
        
        {data.totalCombinado !== undefined && payload.length > 1 && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Total:</span>
            <span className="font-black text-rose-600">
              ${Number(data.totalCombinado || 0).toLocaleString("es-CO")}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function GastosChart({
  data,
  agrupacion,
  setAgrupacion,
  incluirFacturas,
  setIncluirFacturas,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <IoTrendingDown className="text-rose-500" />
            Evolución de Gastos {agrupacion === "mes" ? "Mes a Mes" : "Día a Día"}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compras a proveedores y gastos registrados en el periodo
          </p>
        </div>

        {/* Toggles de agrupación y serie */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Facturas */}
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={incluirFacturas}
              onChange={(e) => setIncluirFacturas(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span>Ver Facturas</span>
          </label>

          {/* Toggle Agrupación: Mes vs Día */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setAgrupacion("mes")}
              className={`px-3 py-1 rounded-lg transition-all ${
                agrupacion === "mes"
                  ? "bg-white text-rose-600 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Mes a Mes
            </button>
            <button
              onClick={() => setAgrupacion("dia")}
              className={`px-3 py-1 rounded-lg transition-all ${
                agrupacion === "dia"
                  ? "bg-white text-rose-600 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Día a Día
            </button>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
          <IoCalendarOutline size={36} className="mb-2 text-slate-300" />
          <p className="text-sm font-medium">No hay datos de compras en este rango de fechas</p>
        </div>
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(val) =>
                  val >= 1000000
                    ? `$${(val / 1000000).toFixed(1)}M`
                    : val >= 1000
                    ? `$${(val / 1000).toFixed(0)}k`
                    : `$${val}`
                }
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                content={<CustomGastosTooltip />}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
              />
              <Bar
                name="Gastos en Pedidos"
                dataKey="gastosPedidos"
                fill="#e11d48"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
              {incluirFacturas && (
                <Bar
                  name="Facturas"
                  dataKey="gastosFacturas"
                  fill="#9333ea"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
