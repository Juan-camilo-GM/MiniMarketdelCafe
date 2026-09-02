import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  IoStorefrontOutline,
  IoReceiptOutline,
  IoAddCircleOutline,
  IoBusinessOutline,
  IoStatsChartOutline,
  IoListOutline,
} from "react-icons/io5";

import GastosDashboard from "./dashboard/GastosDashboard";
import ProveedoresList from "./ProveedoresList";
import PedidosProveedor from "./PedidosProveedor";
import FacturasProveedor from "./FacturasProveedor";
import { Modals } from "./Modals";

const ProveedoresDashboard = () => {
  const [subTabActivo, setSubTabActivo] = useState("resumen"); // 'resumen' | 'proveedores' | 'pedidos' | 'facturas'

  const [proveedores, setProveedores] = useState([]);
  const [pedidosProveedor, setPedidosProveedor] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para modales
  const [modalProveedor, setModalProveedor] = useState(false);
  const [modalPedido, setModalPedido] = useState(false);
  const [modalFactura, setModalFactura] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar proveedores
      const { data: proveedoresData } = await supabase
        .from("proveedores")
        .select("*")
        .order("nombre");
      setProveedores(proveedoresData || []);

      // Cargar pedidos a proveedores
      const { data: pedidosData } = await supabase
        .from("pedidos_proveedor")
        .select(`
          *,
          proveedores (nombre)
        `)
        .order("created_at", { ascending: false });
      setPedidosProveedor(pedidosData || []);

      // Cargar facturas
      const { data: facturasData } = await supabase
        .from("facturas")
        .select(`
          *,
          proveedores (nombre)
        `)
        .order("fecha", { ascending: false });
      setFacturas(facturasData || []);

      // Cargar productos
      const { data: productosData } = await supabase
        .from("productos")
        .select("*")
        .order("nombre");
      setProductos(productosData || []);

    } catch (error) {
      console.error("Error cargando datos de proveedores:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Cargando gestión de proveedores y gastos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Acciones rápidas superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <button
          onClick={() => setModalProveedor(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 md:p-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.98] group"
        >
          <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <IoAddCircleOutline size={22} />
          </div>
          <span className="font-bold text-base md:text-lg">Nuevo Proveedor</span>
        </button>

        <button
          onClick={() => setModalPedido(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 md:p-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.98] group"
        >
          <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <IoStorefrontOutline size={22} />
          </div>
          <span className="font-bold text-base md:text-lg">Nuevo Pedido</span>
        </button>

        <button
          onClick={() => setModalFactura(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3.5 md:p-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md shadow-purple-500/20 hover:scale-[1.01] active:scale-[0.98] group"
        >
          <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <IoReceiptOutline size={22} />
          </div>
          <span className="font-bold text-base md:text-lg">Nueva Factura</span>
        </button>
      </div>

      {/* Sub-navegación dentro de Proveedores */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex flex-wrap gap-1">
        <button
          onClick={() => setSubTabActivo("resumen")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            subTabActivo === "resumen"
              ? "bg-rose-50 text-rose-600 shadow-sm border border-rose-100"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <IoStatsChartOutline size={18} />
          <span>Resumen de Gastos</span>
        </button>

        <button
          onClick={() => setSubTabActivo("pedidos")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            subTabActivo === "pedidos"
              ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <IoStorefrontOutline size={18} />
          <span>Pedidos</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {pedidosProveedor.length}
          </span>
        </button>

        <button
          onClick={() => setSubTabActivo("facturas")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            subTabActivo === "facturas"
              ? "bg-purple-50 text-purple-700 shadow-sm border border-purple-100"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <IoReceiptOutline size={18} />
          <span>Facturas</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {facturas.length}
          </span>
        </button>

        <button
          onClick={() => setSubTabActivo("proveedores")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            subTabActivo === "proveedores"
              ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <IoBusinessOutline size={18} />
          <span>Proveedores</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {proveedores.length}
          </span>
        </button>
      </div>

      {/* Vista activa según sub-tab */}
      <div className="transition-all duration-300">
        {subTabActivo === "resumen" && (
          <GastosDashboard
            pedidosProveedor={pedidosProveedor}
            facturas={facturas}
            proveedores={proveedores}
            onRefresh={cargarDatos}
          />
        )}

        {subTabActivo === "pedidos" && (
          <div className="space-y-6">
            <PedidosProveedor
              pedidos={pedidosProveedor}
              proveedores={proveedores}
              productos={productos}
              onRefresh={cargarDatos}
            />
          </div>
        )}

        {subTabActivo === "facturas" && (
          <div className="space-y-6">
            <FacturasProveedor
              facturas={facturas}
              proveedores={proveedores}
              onRefresh={cargarDatos}
            />
          </div>
        )}

        {subTabActivo === "proveedores" && (
          <div className="space-y-6">
            <ProveedoresList
              proveedores={proveedores}
              onRefresh={cargarDatos}
            />
          </div>
        )}
      </div>

      {/* Modales */}
      <Modals
        modalProveedor={modalProveedor}
        modalPedido={modalPedido}
        modalFactura={modalFactura}
        setModalProveedor={setModalProveedor}
        setModalPedido={setModalPedido}
        setModalFactura={setModalFactura}
        proveedores={proveedores}
        productos={productos}
        onRefresh={cargarDatos}
      />
    </div>
  );
};

export default ProveedoresDashboard;