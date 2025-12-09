import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { IoTrendingUp } from "react-icons/io5";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 outline-none">
                <p className="text-xs font-semibold text-slate-500 mb-1">{data.fecha || label}</p>
                <p className="text-lg font-bold text-indigo-600">
                    ${Number(data.ventas).toLocaleString("es-CO")}
                </p>
                <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Ventas totales</p>
            </div>
        );
    }
    return null;
};

export default function SalesChart({ data }) {
    return (
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <IoTrendingUp className="text-indigo-500" />
                Evolución de Ventas
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="fecha"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            content={<CustomTooltip />}
                        />
                        <Bar dataKey="ventas" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
