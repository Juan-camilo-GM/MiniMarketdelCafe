import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import {
  IoPencil, IoTrashBin, IoCheckmarkCircle,
  IoCloseCircle, IoClose, IoSearch, IoEyeOutline
} from "react-icons/io5";
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTrashOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import { Modal } from "./Modals";

const PedidosProveedor = ({ pedidos, proveedores, productos, onRefresh }) => {
  const [viendoPedido, setViendoPedido] = useState(null);
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null);
  const [pedidoACambiarEstado, setPedidoACambiarEstado] = useState(null);
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
  const cambiarEstadoPedido = (pedidoId, nuevoEstado) => {
    setPedidoACambiarEstado({ id: pedidoId, nuevoEstado });
  };

  const confirmarCambioEstado = async () => {
    if (!pedidoACambiarEstado) return;

    const { id: pedidoId, nuevoEstado } = pedidoACambiarEstado;

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
        duration: 4000,
      });

      setPedidoACambiarEstado(null);
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
  };

  const eliminarPedido = (pedido) => {
    setPedidoAEliminar(pedido);
  };

  const confirmarEliminacion = async () => {
    if (!pedidoAEliminar) return;

    try {
      // Si el pedido está confirmado, ajustar stock
      if (pedidoAEliminar.estado === "confirmado" && pedidoAEliminar.productos && pedidoAEliminar.productos.length > 0) {
        await actualizarStockProductos(pedidoAEliminar.productos, "restar");
      }

      const { error } = await supabase
        .from("pedidos_proveedor")
        .delete()
        .eq("id", pedidoAEliminar.id);

      if (error) throw error;

      toast.success("Pedido eliminado exitosamente", {
        duration: 4000,
      });

      setPedidoAEliminar(null);
      onRefresh();

    } catch (error) {
      console.error("Error eliminando pedido:", error);
      toast.error("Error al eliminar el pedido", {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 5000,
      });
    }
  };

  // Función para abrir modal de visualización
  const abrirVerPedido = (pedido) => {
    setViendoPedido(pedido);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      {/* Encabezado con filtros y paginación */}
      <div className="p-6 border-b border-slate-100 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Pedidos a proveedores ({pedidosFiltrados.length})
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona tus pedidos y recepciones
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Selector de items por página */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">Mostrar:</span>
              <select
                value={itemsPorPagina}
                onChange={(e) => cambiarItemsPorPagina(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            {/* Buscador por proveedor */}
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por proveedor..."
                value={busquedaProveedor}
                onChange={(e) => setBusquedaProveedor(e.target.value)}
                className="pl-10 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl w-full md:w-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de pedidos */}
      {/* Tabla de pedidos (Desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-semibold">
            <tr>
              <th className="px-6 py-4 rounded-tl-lg">Proveedor</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 rounded-tr-lg">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pedidosPaginados.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                <td className="px-6 py-4 font-medium text-slate-900">{pedido.proveedores?.nombre}</td>
                <td className="px-6 py-4 text-slate-600">
                  {format(new Date(pedido.created_at), "dd/MM/yyyy")}
                </td>
                <td className="px-6 py-4 font-bold text-rose-600">
                  ${parseFloat(pedido.total || 0).toLocaleString("es-CO")}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${pedido.estado === "confirmado"
                    ? "bg-emerald-100 text-emerald-700"
                    : pedido.estado === "cancelado"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                    }`}>
                    {pedido.estado === "confirmado" ? "Confirmado" :
                      pedido.estado === "cancelado" ? "Cancelado" : "Pendiente"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {/* Botón VER reemplaza al botón EDITAR */}
                    <button
                      onClick={() => abrirVerPedido(pedido)}
                      className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Ver detalles"
                    >
                      <IoEyeOutline size={18} />
                    </button>

                    {/* BOTONES PARA CAMBIAR ESTADO - MANTENIDOS */}
                    {pedido.estado === "pendiente" && (
                      <>
                        <button
                          onClick={() => cambiarEstadoPedido(pedido.id, "confirmado")}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Confirmar"
                        >
                          <IoCheckmarkCircle size={18} />
                        </button>
                        <button
                          onClick={() => cambiarEstadoPedido(pedido.id, "cancelado")}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Cancelar"
                        >
                          <IoCloseCircle size={18} />
                        </button>
                      </>
                    )}

                    {/* Si el pedido está confirmado, mostrar opción para cancelar */}
                    {pedido.estado === "confirmado" && (
                      <button
                        onClick={() => cambiarEstadoPedido(pedido.id, "cancelado")}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Cancelar"
                      >
                        <IoCloseCircle size={18} />
                      </button>
                    )}

                    {/* Si el pedido está cancelado, mostrar opción para reactivar */}
                    {pedido.estado === "cancelado" && (
                      <button
                        onClick={() => cambiarEstadoPedido(pedido.id, "pendiente")}
                        className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Reactivar"
                      >
                        <IoCheckmarkCircle size={18} />
                      </button>
                    )}

                    <button
                      onClick={() => eliminarPedido(pedido)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Eliminar"
                    >
                      <IoTrashBin size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista de pedidos (Mobile) */}
      <div className="md:hidden space-y-4 p-4 bg-slate-50/50">
        {pedidosPaginados.map((pedido) => (
          <div key={pedido.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">{pedido.proveedores?.nombre}</h4>
                <p className="text-xs text-slate-500">{format(new Date(pedido.created_at), "dd/MM/yyyy")}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${pedido.estado === "confirmado"
                ? "bg-emerald-100 text-emerald-700"
                : pedido.estado === "cancelado"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700"
                }`}>
                {pedido.estado === "confirmado" ? "Conf." :
                  pedido.estado === "cancelado" ? "Canc." : "Pend."}
              </span>
            </div>

            <div className="p-4 flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Total:</span>
              <span className="text-xl font-bold text-rose-600">
                ${parseFloat(pedido.total || 0).toLocaleString("es-CO")}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-5 gap-2">
              <button
                onClick={() => abrirVerPedido(pedido)}
                className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                title="Ver"
              >
                <IoEyeOutline size={20} />
              </button>

              {pedido.estado === "pendiente" ? (
                <>
                  <button
                    onClick={() => cambiarEstadoPedido(pedido.id, "confirmado")}
                    className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    title="Confirmar"
                  >
                    <IoCheckmarkCircle size={20} />
                  </button>
                  <button
                    onClick={() => cambiarEstadoPedido(pedido.id, "cancelado")}
                    className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                    title="Cancelar"
                  >
                    <IoCloseCircle size={20} />
                  </button>
                </>
              ) : pedido.estado === "confirmado" ? (
                <button
                  onClick={() => cambiarEstadoPedido(pedido.id, "cancelado")}
                  className="col-span-2 flex items-center justify-center p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                  title="Cancelar"
                >
                  <IoCloseCircle size={20} />
                </button>
              ) : (
                <button
                  onClick={() => cambiarEstadoPedido(pedido.id, "pendiente")}
                  className="col-span-2 flex items-center justify-center p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                  title="Reactivar"
                >
                  <IoCheckmarkCircle size={20} />
                </button>
              )}

              <div className="addToGrid col-start-5">
                <button
                  onClick={() => eliminarPedido(pedido)}
                  className="w-full h-full flex items-center justify-center p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                  title="Eliminar"
                >
                  <IoTrashBin size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
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
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center text-sm bg-slate-50/50 mt-auto">
          <span className="text-slate-500 font-medium">
            Mostrando <span className="text-slate-800 font-bold">{indiceInicial + 1}</span> a <span className="text-slate-800 font-bold">{Math.min(indiceFinal, pedidosFiltrados.length)}</span> de <span className="text-slate-800 font-bold">{pedidosFiltrados.length}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              Anterior
            </button>

            <div className="flex gap-1">
              {generarNumerosPagina().map((pagina) => (
                <button
                  key={pagina}
                  onClick={() => cambiarPagina(pagina)}
                  className={`w-8 h-8 rounded-lg font-medium transition-colors ${pagina === paginaActual
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {pagina}
                </button>
              ))}
            </div>

            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal para VER pedido (solo visualización) */}
      <Modal
        isOpen={!!viendoPedido}
        onClose={() => setViendoPedido(null)}
        title={`Detalles del Pedido #${viendoPedido?.id || ""}`}
        size="lg"
      >
        {viendoPedido && (
          <div className="space-y-6">
            {/* Información del pedido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Proveedor</p>
                <p className="font-medium text-lg text-slate-800">{viendoPedido.proveedores?.nombre}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Fecha creación</p>
                <p className="font-medium text-slate-800">
                  {format(new Date(viendoPedido.created_at), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Estado</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${viendoPedido.estado === "confirmado"
                  ? "bg-emerald-100 text-emerald-700"
                  : viendoPedido.estado === "cancelado"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
                  }`}>
                  {viendoPedido.estado === "confirmado" ? "Confirmado" :
                    viendoPedido.estado === "cancelado" ? "Cancelado" : "Pendiente"}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total</p>
                <p className="font-bold text-2xl text-rose-600">
                  ${parseFloat(viendoPedido.total || 0).toLocaleString("es-CO")}
                </p>
              </div>

              {viendoPedido.fecha_entrega && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Fecha entrega estimada</p>
                  <p className="font-medium text-slate-800">
                    {format(new Date(viendoPedido.fecha_entrega), "dd/MM/yyyy")}
                  </p>
                </div>
              )}
            </div>

            {/* Descripción */}
            {viendoPedido.descripcion && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Descripción</p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-slate-700">{viendoPedido.descripcion}</p>
                </div>
              </div>
            )}

            {/* Productos del pedido */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <h4 className="font-bold text-slate-700 text-sm">
                  Productos ({viendoPedido.productos?.length || 0})
                </h4>
              </div>

              {!viendoPedido.productos || viendoPedido.productos.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No hay productos en este pedido
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs font-bold text-slate-500 uppercase bg-slate-50/50">
                    <div className="col-span-2">Producto</div>
                    <div className="text-center">Cant.</div>
                    <div className="text-center">Precio Unit.</div>
                    <div className="text-right">Subtotal</div>
                  </div>

                  {viendoPedido.productos.map((producto, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className="col-span-2 font-medium text-slate-800">{producto.nombre || "Producto sin nombre"}</div>
                      <div className="text-center text-slate-600">{producto.cantidad || 0}</div>
                      <div className="text-center text-slate-600">${(producto.precio_unitario || 0).toLocaleString("es-CO")}</div>
                      <div className="text-right font-bold text-emerald-600">
                        ${(producto.subtotal || 0).toLocaleString("es-CO")}
                      </div>
                    </div>
                  ))}

                  {/* Total del pedido */}
                  <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-t border-slate-100">
                    <span className="font-bold text-slate-700">Total del pedido:</span>
                    <span className="font-black text-xl text-rose-600">
                      ${parseFloat(viendoPedido.total || 0).toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de cerrar */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setViendoPedido(null)}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmación de eliminación */}
      {pedidoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <IoTrashBin size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Pedido?</h3>
              <p className="text-slate-500 mb-6">
                {pedidoAEliminar.estado === "confirmado"
                  ? "Este pedido está CONFIRMADO. Al eliminarlo, se ajustará el stock de los productos. ¿Estás seguro?"
                  : "Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este pedido permanentemente?"}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPedidoAEliminar(null)}
                  className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminacion}
                  className="py-3 px-4 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de cambio de estado */}
      {pedidoACambiarEstado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${pedidoACambiarEstado.nuevoEstado === 'confirmado' ? 'bg-emerald-100 text-emerald-600' :
                pedidoACambiarEstado.nuevoEstado === 'cancelado' ? 'bg-rose-100 text-rose-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                {pedidoACambiarEstado.nuevoEstado === 'confirmado' ? <IoCheckmarkCircle size={32} /> :
                  pedidoACambiarEstado.nuevoEstado === 'cancelado' ? <IoCloseCircle size={32} /> :
                    <IoAlertCircleOutline size={32} />}
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {pedidoACambiarEstado.nuevoEstado === 'confirmado' ? '¿Confirmar Pedido?' :
                  pedidoACambiarEstado.nuevoEstado === 'cancelado' ? '¿Cancelar Pedido?' :
                    '¿Reactivar Pedido?'}
              </h3>

              <p className="text-slate-500 mb-6">
                {pedidoACambiarEstado.nuevoEstado === 'confirmado' ? 'El stock de los productos se actualizará automáticamente.' :
                  pedidoACambiarEstado.nuevoEstado === 'cancelado' ? 'Si el pedido estaba confirmado, el stock se ajustará.' :
                    'Si el pedido estaba cancelado, el stock se restaurará.'}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPedidoACambiarEstado(null)}
                  className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCambioEstado}
                  className={`py-3 px-4 rounded-xl text-white font-semibold transition-colors shadow-lg ${pedidoACambiarEstado.nuevoEstado === 'confirmado' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' :
                    pedidoACambiarEstado.nuevoEstado === 'cancelado' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30' :
                      'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30'
                    }`}
                >
                  {pedidoACambiarEstado.nuevoEstado === 'confirmado' ? 'Confirmar' :
                    pedidoACambiarEstado.nuevoEstado === 'cancelado' ? 'Cancelar Pedido' :
                      'Reactivar'}
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