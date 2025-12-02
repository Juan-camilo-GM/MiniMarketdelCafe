import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { 
  IoPencil, IoTrashBin, IoCheckmarkCircle, 
  IoCloseCircle, IoClose, IoSearch 
} from "react-icons/io5";

const PedidosProveedor = ({ pedidos, proveedores, productos, onRefresh }) => {
  const [editandoPedido, setEditandoPedido] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busquedaProveedor, setBusquedaProveedor] = useState("");
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  
  // Estados para editar pedido
  const [formEditarPedido, setFormEditarPedido] = useState({
    descripcion: "",
    productos: [],
    total: 0,
    estado: "pendiente",
    fecha_entrega: "",
  });

  // Filtrar pedidos por estado Y búsqueda de proveedor
  const pedidosFiltrados = pedidos.filter(pedido => {
    const cumpleEstado = !filtroEstado || pedido.estado === filtroEstado;
    const cumpleBusqueda = !busquedaProveedor || 
      pedido.proveedores?.nombre.toLowerCase().includes(busquedaProveedor.toLowerCase());
    return cumpleEstado && cumpleBusqueda;
  });

  // Calcular paginación
  const indiceInicial = (paginaActual - 1) * itemsPorPagina;
  const indiceFinal = indiceInicial + itemsPorPagina;
  const pedidosPaginados = pedidosFiltrados.slice(indiceInicial, indiceFinal);
  const totalPaginas = Math.ceil(pedidosFiltrados.length / itemsPorPagina);

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroEstado, busquedaProveedor]);

  // Funciones para paginación
  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  const cambiarItemsPorPagina = (cantidad) => {
    setItemsPorPagina(parseInt(cantidad));
    setPaginaActual(1);
  };

  // Generar números de página para mostrar
  const generarNumerosPagina = () => {
    const paginas = [];
    const paginasAMostrar = 5;
    
    if (totalPaginas <= paginasAMostrar) {
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      let inicio = Math.max(1, paginaActual - 2);
      let fin = Math.min(totalPaginas, inicio + paginasAMostrar - 1);
      
      if (fin - inicio + 1 < paginasAMostrar) {
        inicio = Math.max(1, fin - paginasAMostrar + 1);
      }
      
      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }
    }
    
    return paginas;
  };

  // Función para actualizar stock de productos
  const actualizarStockProductos = async (productosPedido, operacion) => {
    // operacion: "sumar" (pedido confirmado) o "restar" (pedido cancelado)
    
    try {
      const productosConError = [];
      
      for (const prod of productosPedido) {
        try {
          // Buscar producto por nombre (igual que en HistorialPedidos)
          const { data: productoActual, error: errorGet } = await supabase
            .from("productos")
            .select("stock, id, nombre")
            .eq("nombre", prod.nombre)
            .single();
          
          if (errorGet) {
            console.error(`Producto no encontrado: ${prod.nombre}`, errorGet);
            productosConError.push(prod.nombre);
            continue;
          }
          
          // Calcular nuevo stock
          let nuevoStock = parseFloat(productoActual.stock || 0);
          
          if (operacion === "sumar") {
            nuevoStock += parseFloat(prod.cantidad || 0);
          } else if (operacion === "restar") {
            nuevoStock -= parseFloat(prod.cantidad || 0);
            
            // Evitar stock negativo (aunque en pedidos a proveedores es raro)
            if (nuevoStock < 0) {
              console.warn(`⚠️ Stock negativo para ${productoActual.nombre}. Ajustando a 0`);
              nuevoStock = 0;
            }
          }
          
          // Actualizar stock en la base de datos
          const { error: errorUpdate } = await supabase
            .from("productos")
            .update({ stock: nuevoStock })
            .eq("id", productoActual.id);
          
          if (errorUpdate) {
            productosConError.push(prod.nombre);
            console.error(`Error actualizando stock de ${prod.nombre}:`, errorUpdate);
          } else {
            console.log(`✅ ${operacion === "sumar" ? "Sumado" : "Restado"} ${prod.cantidad} unidades a ${prod.nombre}. Stock nuevo: ${nuevoStock}`);
          }
          
        } catch (error) {
          console.error(`Error procesando producto ${prod.nombre}:`, error);
          productosConError.push(prod.nombre);
        }
      }
      
      return {
        exitoso: productosConError.length === 0,
        productosConError: productosConError
      };
      
    } catch (error) {
      console.error("Error general en actualizarStockProductos:", error);
      return { exitoso: false, productosConError: [] };
    }
  };

  // Función principal para cambiar estado del pedido CON GESTIÓN DE STOCK
  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      // 1. Obtener el pedido actual
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos_proveedor")
        .select("*")
        .eq("id", pedidoId)
        .single();
      
      if (pedidoError) throw pedidoError;
      
      const estadoAnterior = pedido.estado;
      
      // 2. Lógica de gestión de stock según transición de estados
      if (pedido.productos && pedido.productos.length > 0) {
        let resultadoStock = null;
        
        // CASO 1: PENDIENTE → CONFIRMADO (SUMAR stock - recibir productos del proveedor)
        if (nuevoEstado === "confirmado" && estadoAnterior === "pendiente") {
          resultadoStock = await actualizarStockProductos(pedido.productos, "sumar");
        }
        
        // CASO 2: CONFIRMADO → CANCELADO (RESTAR stock - devolver productos al proveedor)
        else if (nuevoEstado === "cancelado" && estadoAnterior === "confirmado") {
          resultadoStock = await actualizarStockProductos(pedido.productos, "restar");
        }
        
        // CASO 3: CANCELADO → PENDIENTE (SUMAR stock - reactivar pedido cancelado)
        else if (nuevoEstado === "pendiente" && estadoAnterior === "cancelado") {
          resultadoStock = await actualizarStockProductos(pedido.productos, "sumar");
        }
        
        // CASO 4: CONFIRMADO → PENDIENTE (RESTAR stock - deshacer confirmación)
        else if (nuevoEstado === "pendiente" && estadoAnterior === "confirmado") {
          resultadoStock = await actualizarStockProductos(pedido.productos, "restar");
        }
        
        // Mostrar advertencia si hubo problemas con algunos productos
        if (resultadoStock && !resultadoStock.exitoso && resultadoStock.productosConError.length > 0) {
          alert(`⚠️ ${nuevoEstado === "confirmado" ? "Confirmación" : "Actualización"} completada, pero hubo problemas con: ${resultadoStock.productosConError.join(", ")}`);
        }
      }
      
      // 3. Actualizar el estado del pedido
      const { error } = await supabase
        .from("pedidos_proveedor")
        .update({ estado: nuevoEstado })
        .eq("id", pedidoId);
      
      if (error) throw error;
      
      // 4. Mensaje según transición
      let mensaje = `✅ Pedido marcado como ${nuevoEstado.toUpperCase()}`;
      
      if (nuevoEstado === "confirmado" && estadoAnterior !== "confirmado") {
        mensaje = "✅ Pedido CONFIRMADO ✓ Stock actualizado";
      } else if (nuevoEstado === "cancelado" && estadoAnterior === "confirmado") {
        mensaje = "✅ Pedido CANCELADO ✗ Stock ajustado";
      } else if (nuevoEstado === "pendiente" && estadoAnterior === "cancelado") {
        mensaje = "✅ Pedido REACTIVADO ✓ Stock restaurado";
      }
      
      alert(mensaje);
      onRefresh();
      
    } catch (error) {
      console.error("Error cambiando estado:", error);
      alert("❌ Error al cambiar el estado: " + error.message);
    }
  };

  const eliminarPedido = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este pedido?")) return;
    
    try {
      // Verificar si el pedido está confirmado (para ajustar stock si es necesario)
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos_proveedor")
        .select("estado, productos")
        .eq("id", id)
        .single();
      
      if (pedidoError) throw pedidoError;
      
      // Si el pedido está confirmado, restar stock antes de eliminar
      if (pedido.estado === "confirmado" && pedido.productos && pedido.productos.length > 0) {
        if (confirm("⚠️ Este pedido está CONFIRMADO. ¿Deseas eliminar y ajustar el stock?")) {
          await actualizarStockProductos(pedido.productos, "restar");
        } else {
          return; // Cancelar eliminación
        }
      }
      
      const { error } = await supabase
        .from("pedidos_proveedor")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      alert("✅ Pedido eliminado exitosamente");
      onRefresh();
      
    } catch (error) {
      console.error("Error eliminando pedido:", error);
      alert("❌ Error al eliminar el pedido");
    }
  };

  // Función para abrir modal de edición
  const abrirEditarPedido = (pedido) => {
    setEditandoPedido(pedido);
    setFormEditarPedido({
      descripcion: pedido.descripcion || "",
      productos: pedido.productos || [],
      total: pedido.total || 0,
      estado: pedido.estado || "pendiente",
      fecha_entrega: pedido.fecha_entrega ? 
        format(new Date(pedido.fecha_entrega), "yyyy-MM-dd") : "",
    });
  };

  // Función para guardar cambios del pedido CON GESTIÓN DE STOCK
  const guardarEditarPedido = async () => {
    if (formEditarPedido.productos.length === 0) {
      alert("El pedido debe tener al menos un producto");
      return;
    }
    
    try {
      const estadoAnterior = editandoPedido.estado;
      const nuevoEstado = formEditarPedido.estado;
      
      // 1. Manejar cambios de stock si cambió el estado
      if (estadoAnterior !== nuevoEstado && editandoPedido.productos?.length > 0) {
        // Misma lógica que en cambiarEstadoPedido
        if (nuevoEstado === "confirmado" && estadoAnterior !== "confirmado") {
          await actualizarStockProductos(formEditarPedido.productos, "sumar");
        } else if (nuevoEstado === "cancelado" && estadoAnterior === "confirmado") {
          await actualizarStockProductos(formEditarPedido.productos, "restar");
        } else if (nuevoEstado === "pendiente" && estadoAnterior === "cancelado") {
          await actualizarStockProductos(formEditarPedido.productos, "sumar");
        } else if (nuevoEstado === "pendiente" && estadoAnterior === "confirmado") {
          await actualizarStockProductos(formEditarPedido.productos, "restar");
        }
      }
      
      // 2. Actualizar pedido en la base de datos
      const pedidoData = {
        descripcion: formEditarPedido.descripcion || null,
        productos: formEditarPedido.productos,
        total: parseFloat(formEditarPedido.total),
        estado: formEditarPedido.estado,
        fecha_entrega: formEditarPedido.fecha_entrega || null,
      };
      
      const { error } = await supabase
        .from("pedidos_proveedor")
        .update(pedidoData)
        .eq("id", editandoPedido.id);
      
      if (error) throw error;
      
      alert("✅ Pedido actualizado exitosamente");
      setEditandoPedido(null);
      onRefresh();
      
    } catch (error) {
      console.error("Error actualizando pedido:", error);
      alert("❌ Error al actualizar el pedido: " + error.message);
    }
  };

  // Funciones para editar productos en el pedido
  const actualizarProductoPedido = (index, campo, valor) => {
    const nuevosProductos = [...formEditarPedido.productos];
    
    if (campo === "cantidad" || campo === "precio_unitario") {
      nuevosProductos[index][campo] = parseFloat(valor);
      nuevosProductos[index].subtotal = 
        nuevosProductos[index].cantidad * nuevosProductos[index].precio_unitario;
    } else {
      nuevosProductos[index][campo] = valor;
    }
    
    const nuevoTotal = nuevosProductos.reduce((sum, prod) => sum + prod.subtotal, 0);
    
    setFormEditarPedido(prev => ({
      ...prev,
      productos: nuevosProductos,
      total: nuevoTotal
    }));
  };

  const eliminarProductoPedido = (index) => {
    const producto = formEditarPedido.productos[index];
    const nuevosProductos = formEditarPedido.productos.filter((_, i) => i !== index);
    
    setFormEditarPedido(prev => ({
      ...prev,
      productos: nuevosProductos,
      total: prev.total - producto.subtotal
    }));
  };

  const agregarProductoVacio = () => {
    const nuevoProducto = {
      nombre: "",
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0
    };
    
    setFormEditarPedido(prev => ({
      ...prev,
      productos: [...prev.productos, nuevoProducto]
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border">
      {/* Encabezado con filtros y paginación */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Pedidos a proveedores ({pedidosFiltrados.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Mostrando {indiceInicial + 1}-{Math.min(indiceFinal, pedidosFiltrados.length)} de {pedidosFiltrados.length}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Selector de items por página */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Mostrar:</span>
            <select
              value={itemsPorPagina}
              onChange={(e) => cambiarItemsPorPagina(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          
          {/* Filtro por estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          
          {/* Buscador por proveedor */}
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por proveedor..."
              value={busquedaProveedor}
              onChange={(e) => setBusquedaProveedor(e.target.value)}
              className="pl-10 px-3 py-2 border rounded-lg w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-700">Proveedor</th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">Fecha</th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">Total</th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">Estado</th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pedidosPaginados.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{pedido.proveedores?.nombre}</td>
                <td className="p-3">
                  {format(new Date(pedido.created_at), "dd/MM/yyyy")}
                </td>
                <td className="p-3 font-bold text-rose-600">
                  ${parseFloat(pedido.total || 0).toLocaleString("es-CO")}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pedido.estado === "confirmado" 
                      ? "bg-emerald-100 text-emerald-800" 
                      : pedido.estado === "cancelado"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {pedido.estado === "confirmado" ? "CONFIRMADO" : 
                     pedido.estado === "cancelado" ? "CANCELADO" : "PENDIENTE"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => abrirEditarPedido(pedido)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm flex items-center gap-1"
                    >
                      <IoPencil size={14} />
                      Editar
                    </button>
                    
                    {/* BOTONES PARA CAMBIAR ESTADO - MANTENIDOS */}
                    {pedido.estado === "pendiente" && (
                      <>
                        <button
                          onClick={() => cambiarEstadoPedido(pedido.id, "confirmado")}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm flex items-center gap-1"
                        >
                          <IoCheckmarkCircle size={14} />
                          Confirmar
                        </button>
                        <button
                          onClick={() => cambiarEstadoPedido(pedido.id, "cancelado")}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm flex items-center gap-1"
                        >
                          <IoCloseCircle size={14} />
                          Cancelar
                        </button>
                      </>
                    )}
                    
                    {/* Si el pedido está confirmado, mostrar opción para cancelar */}
                    {pedido.estado === "confirmado" && (
                      <button
                        onClick={() => cambiarEstadoPedido(pedido.id, "cancelado")}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm flex items-center gap-1"
                      >
                        <IoCloseCircle size={14} />
                        Cancelar
                      </button>
                    )}
                    
                    {/* Si el pedido está cancelado, mostrar opción para reactivar */}
                    {pedido.estado === "cancelado" && (
                      <button
                        onClick={() => cambiarEstadoPedido(pedido.id, "pendiente")}
                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm flex items-center gap-1"
                      >
                        <IoCheckmarkCircle size={14} />
                        Reactivar
                      </button>
                    )}
                    
                    <button
                      onClick={() => eliminarPedido(pedido.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                    >
                      <IoTrashBin size={14} />
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mensaje sin resultados */}
      {pedidosPaginados.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {filtroEstado || busquedaProveedor 
            ? `No hay pedidos que coincidan con los filtros`
            : "No hay pedidos registrados"}
        </div>
      )}
      
      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t">
          <div className="text-sm text-gray-600">
            Página {paginaActual} de {totalPaginas}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botón anterior */}
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className={`px-3 py-1 rounded-lg border ${
                paginaActual === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              ← Anterior
            </button>
            
            {/* Números de página */}
            <div className="flex gap-1">
              {generarNumerosPagina().map((pagina) => (
                <button
                  key={pagina}
                  onClick={() => cambiarPagina(pagina)}
                  className={`w-8 h-8 rounded-lg ${
                    pagina === paginaActual
                      ? 'bg-indigo-600 text-white'
                      : 'border text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pagina}
                </button>
              ))}
            </div>
            
            {/* Botón siguiente */}
            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className={`px-3 py-1 rounded-lg border ${
                paginaActual === totalPaginas 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Siguiente →
            </button>
          </div>
          
          {/* Input para ir a página específica */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Ir a:</span>
            <input
              type="number"
              min="1"
              max={totalPaginas}
              value={paginaActual}
              onChange={(e) => {
                const pagina = parseInt(e.target.value);
                if (pagina >= 1 && pagina <= totalPaginas) {
                  cambiarPagina(pagina);
                }
              }}
              className="w-16 px-2 py-1 border rounded-lg text-center"
            />
            <span className="text-sm text-gray-600">de {totalPaginas}</span>
          </div>
        </div>
      )}

      {/* Modal para editar pedido */}
      {editandoPedido && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Editar Pedido #{editandoPedido.id}
              </h3>
              <button
                onClick={() => setEditandoPedido(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <IoClose size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Información del pedido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Proveedor:</p>
                  <p className="font-medium">{editandoPedido.proveedores?.nombre}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha creación:</p>
                  <p className="font-medium">
                    {format(new Date(editandoPedido.created_at), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
              
              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del pedido
                </label>
                <textarea
                  value={formEditarPedido.descripcion}
                  onChange={(e) => setFormEditarPedido({...formEditarPedido, descripcion: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  rows="3"
                  placeholder="Descripción del pedido..."
                />
              </div>
              
              {/* Estado del pedido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del pedido
                </label>
                <select
                  value={formEditarPedido.estado}
                  onChange={(e) => setFormEditarPedido({...formEditarPedido, estado: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              
              {/* Fecha de entrega */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha estimada de entrega (opcional)
                </label>
                <input
                  type="date"
                  value={formEditarPedido.fecha_entrega}
                  onChange={(e) => setFormEditarPedido({...formEditarPedido, fecha_entrega: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              {/* Productos del pedido */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-800">
                    Productos del pedido ({formEditarPedido.productos.length})
                  </h4>
                  <button
                    onClick={agregarProductoVacio}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    + Agregar producto
                  </button>
                </div>
                
                {formEditarPedido.productos.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No hay productos en este pedido
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formEditarPedido.productos.map((producto, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={producto.nombre}
                              onChange={(e) => actualizarProductoPedido(index, "nombre", e.target.value)}
                              placeholder="Nombre del producto"
                              className="w-full p-2 border rounded mb-2"
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={producto.cantidad}
                                  onChange={(e) => actualizarProductoPedido(index, "cantidad", e.target.value)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Precio unitario</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={producto.precio_unitario}
                                  onChange={(e) => actualizarProductoPedido(index, "precio_unitario", e.target.value)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Subtotal</label>
                                <div className="p-2 bg-white border rounded font-medium text-emerald-600">
                                  ${producto.subtotal.toLocaleString("es-CO")}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => eliminarProductoPedido(index)}
                            className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <IoTrashBin size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total del pedido */}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="font-bold text-lg">Total del pedido:</span>
                      <span className="font-bold text-2xl text-emerald-600">
                        ${formEditarPedido.total.toLocaleString("es-CO")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Botones de acción */}
              <div className="flex gap-3 justify-end pt-6 border-t">
                <button
                  onClick={() => setEditandoPedido(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEditarPedido}
                  disabled={formEditarPedido.productos.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosProveedor;