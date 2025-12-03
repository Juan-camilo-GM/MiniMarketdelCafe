import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { IoPencil, IoTrashBin, IoSearch, IoClose } from "react-icons/io5";
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTrashOutline } from "react-icons/io5";
import toast from "react-hot-toast";

const ProveedoresList = ({ proveedores, onRefresh }) => {
  const [editandoProveedor, setEditandoProveedor] = useState(null);
  const [busquedaProveedor, setBusquedaProveedor] = useState("");
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  
  const [formProveedor, setFormProveedor] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    productos_sum: "",
  });

  // Filtrar proveedores por búsqueda
  const proveedoresFiltrados = busquedaProveedor 
    ? proveedores.filter(prov => 
        prov.nombre.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
        prov.contacto?.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
        prov.email?.toLowerCase().includes(busquedaProveedor.toLowerCase())
      )
    : proveedores;

  // Calcular paginación
  const indiceInicial = (paginaActual - 1) * itemsPorPagina;
  const indiceFinal = indiceInicial + itemsPorPagina;
  const proveedoresPaginados = proveedoresFiltrados.slice(indiceInicial, indiceFinal);
  const totalPaginas = Math.ceil(proveedoresFiltrados.length / itemsPorPagina);

  // Resetear paginación cuando cambia la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaProveedor]);

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

  const abrirModalEditar = (proveedor) => {
    setEditandoProveedor(proveedor);
    setFormProveedor({
      nombre: proveedor.nombre || "",
      contacto: proveedor.contacto || "",
      telefono: proveedor.telefono || "",
      email: proveedor.email || "",
      direccion: proveedor.direccion || "",
      productos_sum: proveedor.productos_sum || "",
    });
  };

  const guardarProveedor = async () => {
    if (!formProveedor.nombre.trim()) {
      toast.error("El nombre del proveedor es requerido", {
        icon: <IoAlertCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }
    
    try {
      let error;
      
      if (editandoProveedor) {
        const { error: updateError } = await supabase
          .from("proveedores")
          .update(formProveedor)
          .eq("id", editandoProveedor.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("proveedores")
          .insert([formProveedor]);
        error = insertError;
      }
      
      if (error) throw error;
      
      toast.success(`Proveedor ${editandoProveedor ? "actualizado" : "registrado"} exitosamente`, {
        icon: <IoCheckmarkCircleOutline size={22} />,
        duration: 4000,
      });
      
      onRefresh();
      setEditandoProveedor(null);
      setFormProveedor({
        nombre: "", contacto: "", telefono: "", email: "", direccion: "", productos_sum: ""
      });
      
    } catch (error) {
      console.error("Error guardando proveedor:", error);
      
      const mensaje = error.message?.includes("network") 
        ? "Error de conexión. Revisa tu internet e intenta de nuevo."
        : "Error al guardar el proveedor";
        
      toast.error(mensaje, {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 5000,
      });
    }
  };

  const eliminarProveedor = async (id, nombre) => {
    // Toast de confirmación personalizado
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex flex-col border border-gray-200`}>
        <div className="flex-1 p-5">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <IoAlertCircleOutline className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">¿Eliminar proveedor?</h3>
              <p className="mt-1 text-gray-600">¿Estás seguro de eliminar al proveedor "{nombre}"? Esta acción no se puede deshacer.</p>
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
                // Verificar si el proveedor tiene facturas o pedidos asociados
                const { data: facturas, error: facturasError } = await supabase
                  .from("facturas")
                  .select("id")
                  .eq("proveedor_id", id)
                  .limit(1);
                
                if (facturasError) throw facturasError;
                
                const { data: pedidos, error: pedidosError } = await supabase
                  .from("pedidos_proveedor")
                  .select("id")
                  .eq("proveedor_id", id)
                  .limit(1);
                
                if (pedidosError) throw pedidosError;
                
                if (facturas.length > 0 || pedidos.length > 0) {
                  // Toast de advertencia para proveedores con relaciones
                  toast.custom((t2) => (
                    <div className={`${t2.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex flex-col border border-gray-200`}>
                      <div className="flex-1 p-5">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <IoAlertCircleOutline className="h-6 w-6 text-orange-600" />
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">No se puede eliminar</h3>
                            <p className="mt-1 text-gray-600">Este proveedor tiene facturas o pedidos asociados. Primero elimine los registros relacionados.</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex border-t border-gray-200">
                        <button
                          onClick={() => {
                            toast.dismiss(t2.id);
                          }}
                          className="flex-1 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-bl-xl rounded-br-xl transition"
                        >
                          Entendido
                        </button>
                      </div>
                    </div>
                  ), {
                    duration: Infinity,
                  });
                  return;
                }
                
                const { error } = await supabase
                  .from("proveedores")
                  .delete()
                  .eq("id", id);
                
                if (error) throw error;
                
                toast.success("Proveedor eliminado exitosamente", {
                  icon: <IoTrashOutline size={22} />,
                  duration: 4000,
                });
                
                onRefresh();
                
              } catch (error) {
                console.error("Error eliminando proveedor:", error);
                
                const mensaje = error.message?.includes("network") 
                  ? "Error de conexión. Revisa tu internet e intenta de nuevo."
                  : "Error al eliminar el proveedor";
                    
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border">
      {/* Encabezado con buscador y paginación */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Proveedores ({proveedoresFiltrados.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Mostrando {indiceInicial + 1}-{Math.min(indiceFinal, proveedoresFiltrados.length)} de {proveedoresFiltrados.length}
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
          
          {/* Buscador de proveedores */}
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proveedor, contacto o email..."
              value={busquedaProveedor}
              onChange={(e) => setBusquedaProveedor(e.target.value)}
              className="pl-10 px-3 py-2 border rounded-lg w-full md:w-64"
            />
            {busquedaProveedor && (
              <button
                onClick={() => setBusquedaProveedor("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <IoClose size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabla de proveedores */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-700">Proveedor</th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">Contacto</th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">Teléfono</th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {proveedoresPaginados.map((prov) => (
              <tr key={prov.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{prov.nombre}</td>
                <td className="p-3">{prov.contacto || "-"}</td>
                <td className="p-3">{prov.telefono || "-"}</td>
                <td className="p-3">{prov.email || "-"}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirModalEditar(prov)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm flex items-center gap-1"
                    >
                      <IoPencil size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarProveedor(prov.id, prov.nombre)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm flex items-center gap-1"
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
      {proveedoresPaginados.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {busquedaProveedor 
            ? `No hay proveedores que coincidan con "${busquedaProveedor}"`
            : "No hay proveedores registrados"}
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

      {/* Modal para editar/crear proveedor */}
      {editandoProveedor !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editandoProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
              </h3>
              <button
                onClick={() => {
                  setEditandoProveedor(null);
                  setFormProveedor({
                    nombre: "", contacto: "", telefono: "", email: "", direccion: "", productos_sum: ""
                  });
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <IoClose size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del proveedor *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Distribuidora ABC S.A."
                  value={formProveedor.nombre}
                  onChange={(e) => setFormProveedor({...formProveedor, nombre: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={formProveedor.contacto}
                    onChange={(e) => setFormProveedor({...formProveedor, contacto: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Ej: 3001234567"
                    value={formProveedor.telefono}
                    onChange={(e) => setFormProveedor({...formProveedor, telefono: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Ej: contacto@proveedor.com"
                  value={formProveedor.email}
                  onChange={(e) => setFormProveedor({...formProveedor, email: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Dirección</label>
                <textarea
                  placeholder="Dirección completa del proveedor"
                  value={formProveedor.direccion}
                  onChange={(e) => setFormProveedor({...formProveedor, direccion: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  rows="2"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Productos que suministra</label>
                <textarea
                  placeholder="Lista de productos o servicios que provee"
                  value={formProveedor.productos_sum}
                  onChange={(e) => setFormProveedor({...formProveedor, productos_sum: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  rows="3"
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setEditandoProveedor(null);
                    setFormProveedor({
                      nombre: "", contacto: "", telefono: "", email: "", direccion: "", productos_sum: ""
                    });
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarProveedor}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editandoProveedor ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedoresList;