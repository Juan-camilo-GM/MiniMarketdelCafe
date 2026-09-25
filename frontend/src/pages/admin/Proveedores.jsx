import { IoStorefrontOutline } from "react-icons/io5";
import ProveedoresDashboard from "../../components/proveedores/ProveedoresDashboard";

export default function Proveedores() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-3 md:mb-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <IoStorefrontOutline className="text-indigo-600" /> Compras & Proveedores
          </h1>
          <p className="text-lg text-slate-500 mt-1">Administración de abastecimiento, inventario y gastos</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <ProveedoresDashboard />
      </div>
    </div>
  );
}
