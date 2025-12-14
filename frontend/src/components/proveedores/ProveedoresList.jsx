import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { IoPencil, IoTrashBin, IoSearch, IoClose } from "react-icons/io5";
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTrashOutline } from "react-icons/io5";
import toast from "react-hot-toast";

export default function ProveedoresList({ proveedores, onRefresh }) {
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

  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);

  const confirmarEliminacion = async () => {
    if (!proveedorAEliminar) return;
    const { id } = proveedorAEliminar;

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
        setProveedorAEliminar(null); // Cerrar modal
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
        duration: 4000,
      });

      onRefresh();
      setProveedorAEliminar(null);

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
  };

  const eliminarProveedor = (id, nombre) => {
    setProveedorAEliminar({ id, nombre });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      {/* Encabezado con buscador y paginación */}
      <div className="p-6 border-b border-slate-100 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Proveedores ({proveedoresFiltrados.length})
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona tus proveedores y contactos
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

            {/* Buscador de proveedores */}
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar proveedor..."
                value={busquedaProveedor}
                onChange={(e) => setBusquedaProveedor(e.target.value)}
                className="pl-10 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl w-full md:w-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              {busquedaProveedor && (
                <button
                  onClick={() => setBusquedaProveedor("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <IoClose size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de proveedores */}
      {/* Tabla de proveedores (Desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-semibold">
            <tr>
              <th className="px-6 py-4 rounded-tl-lg">Proveedor</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Teléfono</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4 rounded-tr-lg">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proveedoresPaginados.map((prov) => (
              <tr key={prov.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                <td className="px-6 py-4 font-medium text-slate-900">{prov.nombre}</td>
                <td className="px-6 py-4 text-slate-600">{prov.contacto || "-"}</td>
                <td className="px-6 py-4 text-slate-600">{prov.telefono || "-"}</td>
                <td className="px-6 py-4 text-slate-600">{prov.email || "-"}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirModalEditar(prov)}
                      className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Editar"
                    >
                      <IoPencil size={18} />
                    </button>
                    <button
                      onClick={() => eliminarProveedor(prov.id, prov.nombre)}
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

      {/* Lista de proveedores (Mobile) */}
      <div className="md:hidden space-y-4 p-4 bg-slate-50/50">
        {proveedoresPaginados.map((prov) => (
          <div key={prov.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{prov.nombre}</h4>
                <p className="text-xs text-slate-500">Registrado</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => abrirModalEditar(prov)}
                  className="p-2 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  <IoPencil size={18} />
                </button>
                <button
                  onClick={() => eliminarProveedor(prov.id, prov.nombre)}
                  className="p-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <IoTrashBin size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Contacto</span>
                <span className="font-medium text-slate-700">{prov.contacto || "-"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Teléfono</span>
                <span className="font-medium text-slate-700">{prov.telefono || "-"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-slate-700 break-all ml-4 text-right">{prov.email || "-"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje sin resultados */}
      {proveedoresPaginados.length === 0 && (
        <div className="text-center py-10">
          <div className="bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <IoSearch className="text-2xl text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">
            {busquedaProveedor
              ? `No hay proveedores que coincidan con "${busquedaProveedor}"`
              : "No hay proveedores registrados"}
          </p>
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center text-sm bg-slate-50/50 mt-auto">
          <span className="text-slate-500 font-medium">
            Mostrando <span className="text-slate-800 font-bold">{indiceInicial + 1}</span> a <span className="text-slate-800 font-bold">{Math.min(indiceFinal, proveedoresFiltrados.length)}</span> de <span className="text-slate-800 font-bold">{proveedoresFiltrados.length}</span>
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

      {/* Modal para editar/crear proveedor */}
      {editandoProveedor !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editandoProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
              </h3>
              <button
                onClick={() => {
                  setEditandoProveedor(null);
                  setFormProveedor({
                    nombre: "", contacto: "", telefono: "", email: "", direccion: "", productos_sum: ""
                  });
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <IoClose size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Nombre del proveedor *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Distribuidora ABC S.A."
                  value={formProveedor.nombre}
                  onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={formProveedor.contacto}
                    onChange={(e) => setFormProveedor({ ...formProveedor, contacto: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Ej: 3001234567"
                    value={formProveedor.telefono}
                    onChange={(e) => setFormProveedor({ ...formProveedor, telefono: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Ej: contacto@proveedor.com"
                  value={formProveedor.email}
                  onChange={(e) => setFormProveedor({ ...formProveedor, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección</label>
                <textarea
                  placeholder="Dirección completa del proveedor"
                  value={formProveedor.direccion}
                  onChange={(e) => setFormProveedor({ ...formProveedor, direccion: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Productos que suministra</label>
                <textarea
                  placeholder="Lista de productos o servicios que provee"
                  value={formProveedor.productos_sum}
                  onChange={(e) => setFormProveedor({ ...formProveedor, productos_sum: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setEditandoProveedor(null);
                    setFormProveedor({
                      nombre: "", contacto: "", telefono: "", email: "", direccion: "", productos_sum: ""
                    });
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarProveedor}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all"
                >
                  {editandoProveedor ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {proveedorAEliminar && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <IoTrashBin size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Proveedor?</h3>
              <p className="text-slate-500 mb-6">
                ¿Estás seguro de eliminar a <strong>{proveedorAEliminar.nombre}</strong>? Esta acción no se puede deshacer.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setProveedorAEliminar(null)}
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
    </div>
  );
};
