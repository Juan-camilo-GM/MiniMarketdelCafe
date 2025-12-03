import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { IoPencil, IoTrashBin, IoEyeOutline, IoClose, IoCameraOutline } from "react-icons/io5";
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTrashOutline } from "react-icons/io5";
import toast from "react-hot-toast";

// Función para obtener la URL correcta de la imagen
const getImageUrl = (path) => {
  if (!path) return null;
  
  // Si ya es una URL completa, devolverla
  if (path.startsWith('http')) return path;
  
  // Extraer el nombre del archivo del path
  const fileName = path.split('/').pop();
  
  // Construir URL pública de Supabase Storage
  return `https://hjilkvwmvkkthozfttwe.supabase.co/storage/v1/object/public/facturas/${fileName}`;
};

const FacturaCard = ({ factura, onEdit, onDelete, onView }) => {
  return (
    <div className="bg-white border rounded-xl p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-gray-900">{factura.numero_factura}</h4>
          <p className="text-sm text-gray-600">{factura.proveedores?.nombre}</p>
        </div>
        <div className="flex gap-2">
          {factura.imagen_url && (
            <button
              onClick={() => onView(factura)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
              title="Ver factura"
            >
              <IoEyeOutline size={18} />
            </button>
          )}
          <button
            onClick={() => onEdit(factura)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Editar"
          >
            <IoPencil size={18} />
          </button>
          <button
            onClick={() => onDelete(factura.id, factura.numero_factura)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Eliminar"
          >
            <IoTrashBin size={18} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500">Fecha</p>
          <p className="font-medium">
            {format(new Date(factura.fecha), "dd/MM/yyyy")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Monto</p>
          <p className="font-bold text-purple-600 text-lg">
            ${parseFloat(factura.monto || 0).toLocaleString("es-CO")}
          </p>
        </div>
      </div>
      
      {factura.descripcion && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500">Descripción</p>
          <p className="text-sm text-gray-700 truncate">{factura.descripcion}</p>
        </div>
      )}
    </div>
  );
};

const FacturasProveedor = ({ facturas, proveedores, onRefresh }) => {
  const [editandoFactura, setEditandoFactura] = useState(null);
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

  const eliminarFactura = async (id, numero) => {
    // Toast de confirmación personalizado
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex flex-col border border-gray-200`}>
        <div className="flex-1 p-5">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <IoAlertCircleOutline className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">¿Eliminar factura?</h3>
              <p className="mt-1 text-gray-600">Esta acción no se puede deshacer. La factura {numero} se eliminará permanentemente.</p>
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
                // Primero obtener la factura para ver si tiene imagen
                const { data: facturaData } = await supabase
                  .from("facturas")
                  .select("imagen_url")
                  .eq("id", id)
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
                  .eq("id", id);
                
                if (error) throw error;
                
                toast.success("Factura eliminada exitosamente", {
                  icon: <IoTrashOutline size={22} />,
                  duration: 4000,
                });
                
                onRefresh();
                
              } catch (error) {
                console.error("Error eliminando factura:", error);
                toast.error("Error al eliminar la factura", {
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
      
      // Si hay una nueva imagen, subirla
      if (formEditarFactura.imagen) {
        // Eliminar imagen anterior si existe
        if (formEditarFactura.imagen_url_actual) {
          try {
            const oldFileName = formEditarFactura.imagen_url_actual.split('/').pop();
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
        
        nueva_imagen_url = `https://hjilkvwmvkkthozfttwe.supabase.co/storage/v1/object/public/facturas/${fileName}`;
      }
      
      // Si se eliminó la imagen (imagen_url_actual es null)
      if (formEditarFactura.imagen_url_actual === null) {
        nueva_imagen_url = null;
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
        icon: <IoCheckmarkCircleOutline size={22} />,
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
    <div className="bg-white rounded-2xl shadow-lg p-6 border">
      {/* Encabezado con controles de paginación */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Facturas registradas ({facturasFiltradas.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Mostrando {indiceInicial + 1}-{Math.min(indiceFinal, facturasFiltradas.length)} de {facturasFiltradas.length}
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
          
          {/* Buscador */}
          <input
            type="text"
            placeholder="Buscar por proveedor o número..."
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className="px-3 py-2 border rounded-lg w-full md:w-64"
          />
        </div>
      </div>
      
      {facturasPaginadas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {filtroProveedor 
            ? `No hay facturas que coincidan con "${filtroProveedor}"`
            : "No hay facturas registradas"}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
        </>
      )}

      {/* Modal para ver imagen */}
      {facturaParaVer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold">Factura: {facturaParaVer.numero_factura}</h3>
              <button
                onClick={() => setFacturaParaVer(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <IoClose size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Proveedor:</p>
                    <p className="font-medium text-lg">{facturaParaVer.proveedores?.nombre}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Número de Factura:</p>
                    <p className="font-medium">{facturaParaVer.numero_factura}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monto:</p>
                    <p className="font-bold text-purple-600 text-xl">
                      ${parseFloat(facturaParaVer.monto || 0).toLocaleString("es-CO")}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha:</p>
                    <p className="font-medium">
                      {format(new Date(facturaParaVer.fecha), "dd/MM/yyyy")}
                    </p>
                  </div>
                  
                  {facturaParaVer.descripcion && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Descripción:</p>
                      <p className="text-gray-700">{facturaParaVer.descripcion}</p>
                    </div>
                  )}
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Imagen de la Factura</h4>
                  
                  {facturaParaVer.imagen_url ? (
                    <div className="space-y-4">
                      <div className="border rounded-lg overflow-hidden">
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          <IoEyeOutline size={16} />
                          Ver imagen en tamaño completo
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg bg-gray-50">
                      <p className="text-gray-500 mb-3">No hay imagen disponible para esta factura</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar factura */}
      {editandoFactura && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Editar Factura: {editandoFactura.numero_factura}
              </h3>
              <button
                onClick={() => setEditandoFactura(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <IoClose size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Factura *
                </label>
                <input
                  type="text"
                  value={formEditarFactura.numero_factura}
                  onChange={(e) => setFormEditarFactura({...formEditarFactura, numero_factura: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto ($) *
                  </label>
                  <input
                    type="number"
                    value={formEditarFactura.monto}
                    onChange={(e) => setFormEditarFactura({...formEditarFactura, monto: e.target.value})}
                    min="0"
                    step="0.01"
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formEditarFactura.fecha}
                    onChange={(e) => setFormEditarFactura({...formEditarFactura, fecha: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formEditarFactura.descripcion}
                  onChange={(e) => setFormEditarFactura({...formEditarFactura, descripcion: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  rows="3"
                />
              </div>
              
              {/* Sección para cambiar imagen */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Imagen de la Factura
                  {formEditarFactura.imagen_url_actual && !formEditarFactura.imagen && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (Imagen actual)
                    </span>
                  )}
                </h4>
                
                <div className="space-y-4">
                  {/* Mostrar imagen actual o vista previa de nueva */}
                  {(formEditarFactura.imagen_preview || formEditarFactura.imagen_url_actual) && (
                    <div className="border rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-2">
                        {formEditarFactura.imagen ? "Nueva imagen (vista previa):" : "Imagen actual:"}
                      </p>
                      <div className="relative">
                        <img
                          src={formEditarFactura.imagen_preview || formEditarFactura.imagen_url_actual}
                          alt="Imagen de factura"
                          className="w-full h-48 object-contain rounded"
                        />
                        <button
                          onClick={eliminarImagenEditar}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                          title="Eliminar imagen"
                        >
                          <IoTrashBin size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Botón para subir nueva imagen */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <IoCameraOutline className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          {formEditarFactura.imagen ? 
                            `Cambiar imagen (${formEditarFactura.imagen.name})` : 
                            "Haz clic para cambiar la imagen"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG (Max. 5MB)</p>
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
              
              <div className="flex gap-3 justify-end pt-6 border-t">
                <button
                  onClick={() => setEditandoFactura(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEditarFactura}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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

export default FacturasProveedor;