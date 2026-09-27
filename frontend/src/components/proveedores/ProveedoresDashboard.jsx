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
import CartLoader from "../../components/ui/CartLoader";

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
        <CartLoader size="large" />
        <p className="text-slate-600 font-medium">Cargando gestión de proveedores y gastos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

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
              onNuevoPedido={() => setModalPedido(true)}
            />
          </div>
        )}

        {subTabActivo === "facturas" && (
          <div className="space-y-6">
            <FacturasProveedor
              facturas={facturas}
              proveedores={proveedores}
              onRefresh={cargarDatos}
              onNuevaFactura={() => setModalFactura(true)}
            />
          </div>
        )}

        {subTabActivo === "proveedores" && (
          <div className="space-y-6">
            <ProveedoresList
              proveedores={proveedores}
              onRefresh={cargarDatos}
              onNuevoProveedor={() => setModalProveedor(true)}
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