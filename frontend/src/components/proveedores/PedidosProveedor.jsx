import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { 
  IoPencil, IoTrashBin, IoCheckmarkCircle, 
  IoCloseCircle, IoClose, IoSearch, IoEyeOutline
} from "react-icons/io5";
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTrashOutline } from "react-icons/io5";
import toast from "react-hot-toast";

const PedidosProveedor = ({ pedidos, proveedores, productos, onRefresh }) => {
  const [viendoPedido, setViendoPedido] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busquedaProveedor, setBusquedaProveedor] = useState("");
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

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
    // Toast de confirmación personalizado
    toast.custom((t) => {
      const estadosConfig = {
        confirmado: {
          titulo: "¿Confirmar pedido?",
          mensaje: "El stock de los productos se actualizará automáticamente.",
          color: "emerald",
          textoBoton: "Confirmar",
        },
        cancelado: {
          titulo: "¿Cancelar pedido?",
          mensaje: "Si el pedido estaba confirmado, el stock se ajustará.",
          color: "red",
          textoBoton: "Cancelar",
        },
        pendiente: {
          titulo: "¿Reactivar pedido?",
          mensaje: "Si el pedido estaba cancelado, el stock se restaurará.",
          color: "amber",
          textoBoton: "Reactivar",
        }
      };

      const config = estadosConfig[nuevoEstado] || {
        titulo: "¿Cambiar estado del pedido?",
        mensaje: "Esta acción puede afectar el stock de productos.",
        color: "blue",
        textoBoton: "Cambiar",
      };

      return (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex flex-col border border-gray-200`}>
          <div className="flex-1 p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <IoAlertCircleOutline className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{config.titulo}</h3>
                <p className="mt-1 text-gray-600">{config.mensaje}</p>
              </div>
            </div>
          </div>
          <div className="flex border-t border-gray-200">
            <button
              onClick={() => {
                toast.dismiss(t.id);
              }}
              className="flex-1 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-bl-2xl transition"
            >
              Volver
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
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
                      toast.error(`Actualización completada, pero hubo problemas con: ${resultadoStock.productosConError.join(", ")}`, {
                        icon: <IoAlertCircleOutline size={22} />,
                        duration: 6000,
                      });
                    }
                  }
                  
                  // 3. Actualizar el estado del pedido
                  const { error } = await supabase
                    .from("pedidos_proveedor")
                    .update({ estado: nuevoEstado })
                    .eq("id", pedidoId);
                  
                  if (error) throw error;
                  
                  // 4. Mensaje según transición
                  let mensaje = `Pedido marcado como ${nuevoEstado.toUpperCase()}`;
                  let icono = <IoCheckmarkCircleOutline size={22} />;
                  
                  if (nuevoEstado === "confirmado" && estadoAnterior !== "confirmado") {
                    mensaje = "Pedido CONFIRMADO ✓ Stock actualizado";
                  } else if (nuevoEstado === "cancelado" && estadoAnterior === "confirmado") {
                    mensaje = "Pedido CANCELADO ✗ Stock ajustado";
                  } else if (nuevoEstado === "pendiente" && estadoAnterior === "cancelado") {
                    mensaje = "Pedido REACTIVADO ✓ Stock restaurado";
                  }
                  
                  toast.success(mensaje, {
                    icon: icono,
                    duration: 4000,
                  });
                  
                  onRefresh();
                  
                } catch (error) {
                  console.error("Error cambiando estado:", error);
                  
                  const mensaje = error.message?.includes("network") 
                    ? "Error de conexión. Revisa tu internet e intenta de nuevo."
                    : error.message || "Error al cambiar el estado del pedido";
                    
                  toast.error(mensaje, {
                    icon: <IoCloseCircleOutline size={22} />,
                    duration: 6000,
                  });
                }
              }}
              className="flex-1 py-3.5 text-base font-medium text-emerald-600 hover:bg-emerald-50 rounded-br-2xl transition border-l border-gray-200"
            >
              {config.textoBoton}
            </button>
          </div>
        </div>
      );
    }, {
      duration: Infinity,
    });
  };

  const eliminarPedido = async (id) => {
    // Toast de confirmación personalizado
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex flex-col border border-gray-200`}>
        <div className="flex-1 p-5">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <IoAlertCircleOutline className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">¿Eliminar pedido?</h3>
              <p className="mt-1 text-gray-600">Esta acción eliminará el pedido permanentemente.</p>
            </div>
          </div>
        </div>
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            className="flex-1 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-bl-2xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                // Verificar si el pedido está confirmado (para ajustar stock si es necesario)
                const { data: pedido, error: pedidoError } = await supabase
                  .from("pedidos_proveedor")
                  .select("estado, productos")
                  .eq("id", id)
                  .single();
                
                if (pedidoError) throw pedidoError;
                
                // Si el pedido está confirmado, mostrar confirmación adicional
                if (pedido.estado === "confirmado" && pedido.productos && pedido.productos.length > 0) {
                  // Toast de confirmación para pedido confirmado
                  toast.custom((t2) => (
                    <div className={`${t2.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex flex-col border border-gray-200`}>
                      <div className="flex-1 p-5">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <IoAlertCircleOutline className="h-6 w-6 text-orange-600" />
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">¡Atención!</h3>
                            <p className="mt-1 text-gray-600">Este pedido está CONFIRMADO. Al eliminar, se ajustará el stock de los productos.</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex border-t border-gray-200">
                        <button
                          onClick={() => {
                            toast.dismiss(t2.id);
                          }}
                          className="flex-1 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-bl-xl transition"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={async () => {
                            toast.dismiss(t2.id);
                            await actualizarStockProductos(pedido.productos, "restar");
                            
                            const { error } = await supabase
                              .from("pedidos_proveedor")
                              .delete()
                              .eq("id", id);
                            
                            if (error) throw error;
                            
                            toast.success("Pedido eliminado exitosamente", {
                              icon: <IoTrashOutline size={22} />,
                              duration: 4000,
                            });
                            
                            onRefresh();
                          }}
                          className="flex-1 py-3 text-base font-medium text-orange-600 hover:bg-orange-50 rounded-br-xl transition border-l border-gray-200"
                        >
                          Eliminar y ajustar stock
                        </button>
                      </div>
                    </div>
                  ), {
                    duration: Infinity,
                  });
                  return;
                }
                
                // Para pedidos no confirmados, eliminar directamente
                const { error } = await supabase
                  .from("pedidos_proveedor")
                  .delete()
                  .eq("id", id);
                
                if (error) throw error;
                
                toast.success("Pedido eliminado exitosamente", {
                  icon: <IoTrashOutline size={22} />,
                  duration: 4000,
                });
                
                onRefresh();
                
              } catch (error) {
                console.error("Error eliminando pedido:", error);
                
                const mensaje = error.message?.includes("network") 
                  ? "Error de conexión. Revisa tu internet e intenta de nuevo."
                  : "Error al eliminar el pedido";
                    
                toast.error(mensaje, {
                  icon: <IoCloseCircleOutline size={22} />,
                  duration: 5000,
                });
              }
            }}
            className="flex-1 py-3.5 text-base font-medium text-red-600 hover:bg-red-50 rounded-br-2xl transition border-l border-gray-200"
          >
            Eliminar
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
    });
  };

  // Función para abrir modal de visualización
  const abrirVerPedido = (pedido) => {
    setViendoPedido(pedido);
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
                    {/* Botón VER reemplaza al botón EDITAR */}
                    <button
                      onClick={() => abrirVerPedido(pedido)}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm flex items-center gap-1"
                    >
                      <IoEyeOutline size={14} />
                      Ver
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

      {/* Modal para VER pedido (solo visualización) */}
      {viendoPedido && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Detalles del Pedido #{viendoPedido.id}
              </h3>
              <button
                onClick={() => setViendoPedido(null)}
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
                  <p className="font-medium text-lg">{viendoPedido.proveedores?.nombre}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha creación:</p>
                  <p className="font-medium">
                    {format(new Date(viendoPedido.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Estado:</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    viendoPedido.estado === "confirmado" 
                      ? "bg-emerald-100 text-emerald-800" 
                      : viendoPedido.estado === "cancelado"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {viendoPedido.estado === "confirmado" ? "CONFIRMADO" : 
                     viendoPedido.estado === "cancelado" ? "CANCELADO" : "PENDIENTE"}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total:</p>
                  <p className="font-bold text-2xl text-rose-600">
                    ${parseFloat(viendoPedido.total || 0).toLocaleString("es-CO")}
                  </p>
                </div>
                
                {viendoPedido.fecha_entrega && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha entrega estimada:</p>
                    <p className="font-medium">
                      {format(new Date(viendoPedido.fecha_entrega), "dd/MM/yyyy")}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Descripción */}
              {viendoPedido.descripcion && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Descripción:</p>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-700">{viendoPedido.descripcion}</p>
                  </div>
                </div>
              )}
              
              {/* Productos del pedido */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Productos ({viendoPedido.productos?.length || 0})
                </h4>
                
                {!viendoPedido.productos || viendoPedido.productos.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No hay productos en este pedido
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-2 text-sm font-medium text-gray-700 pb-2 border-b">
                      <div className="col-span-2">Producto</div>
                      <div className="text-center">Cantidad</div>
                      <div className="text-center">Precio Unitario</div>
                      <div className="text-right">Subtotal</div>
                    </div>
                    
                    {viendoPedido.productos.map((producto, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2 py-2 border-b last:border-b-0">
                        <div className="col-span-2 font-medium">{producto.nombre || "Producto sin nombre"}</div>
                        <div className="text-center">{producto.cantidad || 0}</div>
                        <div className="text-center">${(producto.precio_unitario || 0).toLocaleString("es-CO")}</div>
                        <div className="text-right font-medium text-emerald-600">
                          ${(producto.subtotal || 0).toLocaleString("es-CO")}
                        </div>
                      </div>
                    ))}
                    
                    {/* Total del pedido */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-bold text-lg">Total del pedido:</span>
                      <span className="font-bold text-2xl text-rose-600">
                        ${parseFloat(viendoPedido.total || 0).toLocaleString("es-CO")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Botón de cerrar */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={() => setViendoPedido(null)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Cerrar
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