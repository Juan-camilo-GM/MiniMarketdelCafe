import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { IoPencil, IoTrashBin, IoEyeOutline, IoClose, IoCameraOutline, IoSearch } from "react-icons/io5";
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTrashOutline } from "react-icons/io5";

import toast from "react-hot-toast";
import { Modal } from "./Modals";

// Función para obtener la URL correcta de la imagen
// Función para obtener la URL correcta de la imagen
const getImageUrl = (path) => {
  if (!path) return null;

  // Si ya es una URL completa, devolverla
  if (path.startsWith('http')) return path;

  // Si es solo el nombre del archivo, obtener la URL pública de Supabase
  const { data } = supabase.storage
    .from('facturas')
    .getPublicUrl(path); // Supabase maneja la construcción de la URL

  return data.publicUrl;
};

const FacturaCard = ({ factura, onEdit, onDelete, onView }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-indigo-100 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-slate-800 text-lg">{factura.numero_factura}</h4>
          <p className="text-sm text-slate-500 font-medium">{factura.proveedores?.nombre}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {factura.imagen_url && (
            <button
              onClick={() => onView(factura)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Ver factura"
            >
              <IoEyeOutline size={18} />
            </button>
          )}
          <button
            onClick={() => onEdit(factura)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <IoPencil size={18} />
          </button>
          <button
            onClick={() => onDelete(factura.id, factura.numero_factura)}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <IoTrashBin size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Fecha</p>
          <p className="font-medium text-slate-700">
            {format(new Date(factura.fecha), "dd/MM/yyyy")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">Monto</p>
          <p className="font-bold text-indigo-600 text-xl">
            ${parseFloat(factura.monto || 0).toLocaleString("es-CO")}
          </p>
        </div>
      </div>

      {factura.descripcion && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Descripción</p>
          <p className="text-sm text-slate-600 truncate">{factura.descripcion}</p>
        </div>
      )}
    </div>
  );
};

const FacturasProveedor = ({ facturas, proveedores, onRefresh }) => {
  const [editandoFactura, setEditandoFactura] = useState(null);
  const [facturaAEliminar, setFacturaAEliminar] = useState(null);
  const [facturaParaVer, setFacturaParaVer] = useState(null);
  const [filtroProveedor, setFiltroProveedor] = useState("");

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  // Estados para editar factura
  const [formEditarFactura, setFormEditarFactura] = useState({
    numero_factura: "",
    monto: "",
    fecha: "",
    descripcion: "",
    imagen: null,
    imagen_preview: null,
    imagen_url_actual: "",
  });

  // Filtrar facturas
  const facturasFiltradas = filtroProveedor
    ? facturas.filter(f =>
      f.proveedores?.nombre.toLowerCase().includes(filtroProveedor.toLowerCase()) ||
      f.numero_factura.toLowerCase().includes(filtroProveedor.toLowerCase())
    )
    : facturas;

  // Calcular paginación
  const indiceInicial = (paginaActual - 1) * itemsPorPagina;
  const indiceFinal = indiceInicial + itemsPorPagina;
  const facturasPaginadas = facturasFiltradas.slice(indiceInicial, indiceFinal);
  const totalPaginas = Math.ceil(facturasFiltradas.length / itemsPorPagina);

  // Resetear paginación cuando cambia el filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroProveedor]);

  // Funciones para paginación
  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  const cambiarItemsPorPagina = (cantidad) => {
    setItemsPorPagina(parseInt(cantidad));
    setPaginaActual(1);
  };

  const eliminarFactura = (id, numero) => {
    setFacturaAEliminar({ id, numero });
  };

  const confirmarEliminacion = async () => {
    if (!facturaAEliminar) return;

    try {
      // Primero obtener la factura para ver si tiene imagen
      const { data: facturaData } = await supabase
        .from("facturas")
        .select("imagen_url")
        .eq("id", facturaAEliminar.id)
        .single();

      // Si tiene imagen, eliminarla del storage
      if (facturaData?.imagen_url) {
        const fileName = facturaData.imagen_url.split('/').pop();
        await supabase.storage
          .from('facturas')
          .remove([fileName]);
      }

      // Eliminar la factura de la base de datos
      const { error } = await supabase
        .from("facturas")
        .delete()
        .eq("id", facturaAEliminar.id);

      if (error) throw error;

      toast.success("Factura eliminada exitosamente", {
        duration: 4000,
      });

      setFacturaAEliminar(null);
      onRefresh();

    } catch (error) {
      console.error("Error eliminando factura:", error);
      toast.error("Error al eliminar la factura", {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 5000,
      });
    }
  };

  // Función para abrir modal de edición
  const abrirEditarFactura = (factura) => {
    setEditandoFactura(factura);
    setFormEditarFactura({
      numero_factura: factura.numero_factura || "",
      monto: factura.monto || "",
      fecha: factura.fecha ? format(new Date(factura.fecha), "yyyy-MM-dd") : "",
      descripcion: factura.descripcion || "",
      imagen: null,
      imagen_preview: factura.imagen_url || null,
      imagen_url_actual: factura.imagen_url || null,
    });
  };

  // Función para manejar nueva imagen en edición
  const handleImagenEditar = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecciona un archivo de imagen", {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen es muy grande. Máximo 5MB", {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }

    setFormEditarFactura(prev => ({
      ...prev,
      imagen: file,
      imagen_preview: URL.createObjectURL(file)
    }));
  };

  // Función para eliminar imagen en edición
  const eliminarImagenEditar = () => {
    // Toast de confirmación para eliminar imagen
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex flex-col border border-gray-200`}>
        <div className="flex-1 p-5">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <IoAlertCircleOutline className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">¿Eliminar imagen?</h3>
              <p className="mt-1 text-gray-600">Esta imagen se eliminará de la factura.</p>
            </div>
          </div>
        </div>
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            className="flex-1 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-bl-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              setFormEditarFactura(prev => ({
                ...prev,
                imagen: null,
                imagen_preview: null,
                imagen_url_actual: null
              }));
            }}
            className="flex-1 py-3 text-base font-medium text-orange-600 hover:bg-orange-50 rounded-br-xl transition border-l border-gray-200"
          >
            Eliminar
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
    });
  };

  // Función para guardar cambios de factura
  const guardarEditarFactura = async () => {
    if (!formEditarFactura.numero_factura.trim() || !formEditarFactura.monto) {
      toast.error("Número de factura y monto son requeridos", {
        icon: <IoAlertCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }

    try {
      let nueva_imagen_url = formEditarFactura.imagen_url_actual;

      // Si se eliminó la imagen explícitamente (imagen_url_actual es null y no hay nueva imagen)
      if (formEditarFactura.imagen_url_actual === null && !formEditarFactura.imagen) {
        // Eliminar imagen del storage si había una antes
        if (editandoFactura.imagen_url) {
          try {
            const oldFileName = editandoFactura.imagen_url.split('/').pop();
            await supabase.storage
              .from('facturas')
              .remove([oldFileName]);
          } catch (error) {
            console.warn("No se pudo eliminar imagen anterior:", error);
          }
        }
        nueva_imagen_url = null;
      }
      // Si hay una nueva imagen, subirla
      else if (formEditarFactura.imagen) {
        // Eliminar imagen anterior si existe
        if (editandoFactura.imagen_url) { // Check original factura's image_url
          try {
            const oldFileName = editandoFactura.imagen_url.split('/').pop();
            await supabase.storage
              .from('facturas')
              .remove([oldFileName]);
          } catch (error) {
            console.warn("No se pudo eliminar imagen anterior:", error);
          }
        }

        // Subir nueva imagen
        const fileName = `${Date.now()}_${formEditarFactura.numero_factura.replace(/[^a-zA-Z0-9]/g, '_')}.${formEditarFactura.imagen.name.split('.').pop()}`;

        const { error: uploadError } = await supabase.storage
          .from('facturas')
          .upload(fileName, formEditarFactura.imagen);

        if (uploadError) throw uploadError;

        // Obtener la URL pública usando el cliente de Supabase
        const { data: urlData } = supabase.storage
          .from('facturas')
          .getPublicUrl(fileName);

        nueva_imagen_url = urlData.publicUrl;
      }

      // Actualizar factura en la base de datos
      const facturaData = {
        numero_factura: formEditarFactura.numero_factura,
        monto: parseFloat(formEditarFactura.monto),
        fecha: formEditarFactura.fecha,
        descripcion: formEditarFactura.descripcion || null,
        imagen_url: nueva_imagen_url
      };

      const { error } = await supabase
        .from("facturas")
        .update(facturaData)
        .eq("id", editandoFactura.id);

      if (error) throw error;

      toast.success("Factura actualizada exitosamente", {
        duration: 4000,
      });

      setEditandoFactura(null);
      onRefresh();

    } catch (error) {
      console.error("Error actualizando factura:", error);

      const mensaje = error.message?.includes("network")
        ? "Error de conexión. Revisa tu internet e intenta de nuevo."
        : error.message || "Error al actualizar la factura";

      toast.error(mensaje, {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 6000,
      });
    }
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      {/* Encabezado con controles de paginación */}
      <div className="p-6 border-b border-slate-100 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Facturas registradas ({facturasFiltradas.length})
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona y visualiza tus facturas de proveedores
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

            {/* Buscador */}
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por proveedor o número..."
                value={filtroProveedor}
                onChange={(e) => setFiltroProveedor(e.target.value)}
                className="pl-10 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl w-full md:w-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {facturasPaginadas.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {filtroProveedor
            ? `No hay facturas que coincidan con "${filtroProveedor}"`
            : "No hay facturas registradas"}
        </div>
      ) : (
        <div className="p-6 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {facturasPaginadas.map((factura) => (
              <FacturaCard
                key={factura.id}
                factura={factura}
                onEdit={abrirEditarFactura}
                onDelete={eliminarFactura}
                onView={(f) => setFacturaParaVer(f)}
              />
            ))}
          </div>

          {/* Componente de paginación */}
          {totalPaginas > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center text-sm bg-white mt-auto rounded-b-2xl">
              <span className="text-slate-500 font-medium">
                Mostrando <span className="text-slate-800 font-bold">{indiceInicial + 1}</span> a <span className="text-slate-800 font-bold">{Math.min(indiceFinal, facturasFiltradas.length)}</span> de <span className="text-slate-800 font-bold">{facturasFiltradas.length}</span>
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
        </div>
      )}

      {/* Modal para ver imagen */}
      <Modal
        isOpen={!!facturaParaVer}
        onClose={() => setFacturaParaVer(null)}
        title={`Factura: ${facturaParaVer?.numero_factura || ""}`}
        size="lg"
      >
        {facturaParaVer && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Proveedor</p>
                  <p className="font-medium text-lg text-slate-800">{facturaParaVer.proveedores?.nombre}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Número de Factura</p>
                  <p className="font-medium text-slate-800">{facturaParaVer.numero_factura}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Monto</p>
                  <p className="font-bold text-indigo-600 text-xl">
                    ${parseFloat(facturaParaVer.monto || 0).toLocaleString("es-CO")}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Fecha</p>
                  <p className="font-medium text-slate-800">
                    {format(new Date(facturaParaVer.fecha), "dd/MM/yyyy")}
                  </p>
                </div>

                {facturaParaVer.descripcion && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Descripción</p>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-slate-700">{facturaParaVer.descripcion}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <h4 className="font-bold text-slate-800 mb-3">Imagen de la Factura</h4>

                {facturaParaVer.imagen_url ? (
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <img
                        src={getImageUrl(facturaParaVer.imagen_url)}
                        alt={`Factura ${facturaParaVer.numero_factura}`}
                        className="w-full h-auto max-h-96 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/600x400?text=Imagen+no+disponible";
                        }}
                      />
                    </div>

                    <div className="text-center">
                      <a
                        href={getImageUrl(facturaParaVer.imagen_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all font-medium"
                      >
                        <IoEyeOutline size={18} />
                        Ver imagen en tamaño completo
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                    <p className="text-slate-500 mb-3">No hay imagen disponible para esta factura</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setFacturaParaVer(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para editar factura */}
      <Modal
        isOpen={!!editandoFactura}
        onClose={() => setEditandoFactura(null)}
        title={`Editar Factura: ${editandoFactura?.numero_factura || ""}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Número de Factura *
            </label>
            <input
              type="text"
              value={formEditarFactura.numero_factura}
              onChange={(e) => setFormEditarFactura({ ...formEditarFactura, numero_factura: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Monto ($) *
              </label>
              <input
                type="number"
                value={formEditarFactura.monto}
                onChange={(e) => setFormEditarFactura({ ...formEditarFactura, monto: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={formEditarFactura.fecha}
                onChange={(e) => setFormEditarFactura({ ...formEditarFactura, fecha: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={formEditarFactura.descripcion}
              onChange={(e) => setFormEditarFactura({ ...formEditarFactura, descripcion: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              rows="3"
            />
          </div>

          {/* Sección para cambiar imagen */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>Imagen de la Factura</span>
              {formEditarFactura.imagen_url_actual && !formEditarFactura.imagen && (
                <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                  Imagen actual
                </span>
              )}
            </h4>

            <div className="space-y-4">
              {/* Mostrar imagen actual o vista previa de nueva */}
              {(formEditarFactura.imagen_preview || formEditarFactura.imagen_url_actual) && (
                <div className="border border-slate-200 rounded-xl p-3 bg-white">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                    {formEditarFactura.imagen ? "Nueva imagen (vista previa):" : "Imagen actual:"}
                  </p>
                  <div className="relative group">
                    <img
                      src={formEditarFactura.imagen_preview || getImageUrl(formEditarFactura.imagen_url_actual)}
                      alt="Imagen de factura"
                      className="w-full h-48 object-contain rounded-lg"
                    />
                    <button
                      onClick={eliminarImagenEditar}
                      className="absolute top-2 right-2 bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Eliminar imagen"
                    >
                      <IoTrashBin size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Botón para subir nueva imagen */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors bg-white">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <IoCameraOutline className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">
                      {formEditarFactura.imagen ?
                        `Cambiar imagen (${formEditarFactura.imagen.name})` :
                        "Haz clic para cambiar la imagen"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG (Max. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImagenEditar}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
            <button
              onClick={() => setEditandoFactura(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardarEditarFactura}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      {facturaAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <IoTrashBin size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Factura?</h3>
              <p className="text-slate-500 mb-6">
                ¿Estás seguro de eliminar la factura <strong>{facturaAEliminar.numero}</strong>? Esta acción no se puede deshacer.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFacturaAEliminar(null)}
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

export default FacturasProveedor;