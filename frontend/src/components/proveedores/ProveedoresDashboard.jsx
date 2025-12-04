import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  IoStorefrontOutline,
  IoReceiptOutline,
  IoAddCircleOutline,
  IoBusinessOutline,
  IoCardOutline,
} from "react-icons/io5";
import ProveedoresList from "./ProveedoresList";
import PedidosProveedor from "./PedidosProveedor";
import FacturasProveedor from "./FacturasProveedor";
import { Modals } from "./Modals";

const ProveedoresDashboard = () => {
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
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas
  const gastosTotales = pedidosProveedor
    .filter(p => p.estado === "recibido" || p.estado === "confirmado")
    .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);

  const gastosPendientes = pedidosProveedor
    .filter(p => p.estado === "pendiente")
    .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);

  const facturasTotales = facturas.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando gestión de proveedores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total proveedores</p>
              <p className="text-3xl font-black text-indigo-600 mt-2 group-hover:scale-105 transition-transform origin-left">{proveedores.length}</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-2xl group-hover:bg-indigo-100 transition-colors">
              <IoBusinessOutline className="text-3xl text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Gastos en pedidos</p>
              <p className="text-3xl font-black text-rose-600 mt-2 group-hover:scale-105 transition-transform origin-left">
                ${gastosTotales.toLocaleString("es-CO")}
              </p>
              <p className="text-xs font-medium text-slate-400 mt-1">
                ${gastosPendientes.toLocaleString("es-CO")} pendientes
              </p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl group-hover:bg-rose-100 transition-colors">
              <IoCardOutline className="text-3xl text-rose-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total facturado</p>
              <p className="text-3xl font-black text-purple-600 mt-2 group-hover:scale-105 transition-transform origin-left">
                ${facturasTotales.toLocaleString("es-CO")}
              </p>
              <p className="text-xs font-medium text-slate-400 mt-1">
                {facturas.length} facturas registradas
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl group-hover:bg-purple-100 transition-colors">
              <IoReceiptOutline className="text-3xl text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setModalProveedor(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] group"
        >
          <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <IoAddCircleOutline size={24} />
          </div>
          <span className="font-bold text-lg">Nuevo Proveedor</span>
        </button>
        <button
          onClick={() => setModalPedido(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] group"
        >
          <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <IoStorefrontOutline size={24} />
          </div>
          <span className="font-bold text-lg">Nuevo Pedido</span>
        </button>
        <button
          onClick={() => setModalFactura(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] group"
        >
          <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <IoReceiptOutline size={24} />
          </div>
          <span className="font-bold text-lg">Nueva Factura</span>
        </button>
      </div>

      {/* Componentes separados */}
      <ProveedoresList
        proveedores={proveedores}
        onRefresh={cargarDatos}
      />

      <PedidosProveedor
        pedidos={pedidosProveedor}
        proveedores={proveedores}
        productos={productos}
        onRefresh={cargarDatos}
      />

      <FacturasProveedor
        facturas={facturas}
        proveedores={proveedores}
        onRefresh={cargarDatos}
      />

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