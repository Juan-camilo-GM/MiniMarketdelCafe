import {
  IoSaveOutline,
  IoTrashBin,
  IoClose,
  IoAlertCircleOutline,
  IoAdd,
  IoSearch,
  IoFilter,
  IoCubeOutline,
  IoWarningOutline,
  IoImageOutline,
  IoPencil,
  IoCloudUploadOutline
} from "react-icons/io5";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast"
import {
  obtenerProductos,
  agregarProducto,
  actualizarProducto,
  eliminarProducto
} from "../../lib/productos";
import { obtenerCategorias } from "../../lib/categorias";
import { subirImagen } from "../../lib/storage";
import { supabase } from "../../lib/supabase";

// Helper para borrar imágenes antiguas
const deleteOldImage = async (url) => {
  if (!url) return false;
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (!match) return false;
    const path = match[1];
    const { error } = await supabase.storage.from("productos").remove([path]);
    if (error) {
      console.error("Error borrando imagen:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Excepción borrando imagen:", err);
    return false;
  }
};

export default function Productos() {
  // === ESTADOS ===
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [loading, setLoading] = useState(false);             // Loading para acciones (guardar/eliminar)
  const [cargandoProductos, setCargandoProductos] = useState(true); // Loading inicial

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  // Modales
  const [isOpen, setIsOpen] = useState(false); // Crear/Editar
  const [productoAEliminar, setProductoAEliminar] = useState(null); // Eliminar

  // Formulario
  const [formProducto, setFormProducto] = useState({
    id: null,
    nombre: "",
    precio: "",
    stock: "",
    categoria_id: "",
    imagen_url: null,
    is_featured: false
  });
  const [imagenFile, setImagenFile] = useState(null);

  // Elimina la imagen inmediatamente (local o del bucket)
  const removeImageNow = async () => {
    try {
      if (imagenFile) {
        setImagenFile(null);
        setFormProducto(p => ({ ...p, imagen_url: null }));
        toast.success("Imagen removida");
        return;
      }

      if (formProducto.imagen_url) {
        const url = formProducto.imagen_url;
        const ok = await deleteOldImage(url);
        if (ok) {
          setFormProducto(p => ({ ...p, imagen_url: null }));
          toast.success("Imagen eliminada del bucket");
        } else {
          toast.error("No se pudo eliminar la imagen del bucket");
        }
      }
    } catch (err) {
      console.error("Error eliminando imagen", err);
      toast.error("Error eliminando la imagen");
    }
  };

  // === CARGA DE DATOS ===
  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargandoProductos(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        obtenerProductos(),
        obtenerCategorias(),
      ]);
      setProductos(prodsRes || []);
      setCategorias(catsRes || []);
      setCatMap(Object.fromEntries((catsRes || []).map((c) => [c.id, c.nombre])));
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar datos");
    } finally {
      setCargandoProductos(false);
    }
  }

  // === CALCULOS DERIVADOS ===
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const texto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const categoria = filtroCategoria === "" || p.categoria_id === Number(filtroCategoria);
      return texto && categoria;
    });
  }, [productos, busqueda, filtroCategoria]);

  const stats = useMemo(() => {
    const total = productos.length;
    const lowStock = productos.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outOfStock = productos.filter(p => p.stock === 0).length;
    return { total, lowStock, outOfStock };
  }, [productos]);

  // === HANDLERS DEL FORMULARIO ===
  const abrirCrear = () => {
    setFormProducto({ id: null, nombre: "", precio: "", stock: "", categoria_id: "", imagen_url: null, is_featured: false });
    setImagenFile(null);
    setIsOpen(true);
  };

  const abrirEditar = (p) => {
    setFormProducto({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock,
      categoria_id: p.categoria_id || p.categorias?.id || "",
      imagen_url: p.imagen_url || null,
      is_featured: p.is_featured || false
    });
    setImagenFile(null);
    setIsOpen(true);
  };

  const cerrar = () => {
    setIsOpen(false);
    setFormProducto({ id: null, nombre: "", precio: "", stock: "", categoria_id: "", imagen_url: null, is_featured: false });
    setImagenFile(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormProducto(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const guardar = async () => {
    if (!formProducto.nombre || !formProducto.precio || !formProducto.categoria_id) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      let imagen_url = formProducto.imagen_url;

      // 1. Subir imagen si existe
      if (imagenFile) {
        if (formProducto.imagen_url) await deleteOldImage(formProducto.imagen_url);
        const url = await subirImagen(imagenFile);
        if (url) imagen_url = url;
      }

      const datos = {
        nombre: formProducto.nombre,
        precio: Number(formProducto.precio),
        stock: Number(formProducto.stock),
        categoria_id: Number(formProducto.categoria_id),
        imagen_url,
        is_featured: formProducto.is_featured,
      };

      // 2. Guardar o Actualizar
      if (formProducto.id) {
        const actualizado = await actualizarProducto(formProducto.id, datos);
        setProductos(prev => prev.map(p => p.id === actualizado.id ? { ...actualizado, categorias: { nombre: catMap[actualizado.categoria_id] } } : p));
        toast.success("Producto actualizado");
      } else {
        const nuevo = await agregarProducto(datos);
        setProductos(prev => [...prev, { ...nuevo, categorias: { nombre: catMap[nuevo.categoria_id] } }]);
        toast.success("Producto creado");
      }
      cerrar();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminacion = async () => {
    if (!productoAEliminar) return;
    try {
      await eliminarProducto(productoAEliminar);
      setProductos(prev => prev.filter(p => p.id !== productoAEliminar));
      toast.success("Producto eliminado");
      setProductoAEliminar(null);
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  // === RENDER ===
  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* HEADER & STATS */}
      <div className="bg-slate-50 sticky top-[60px] lg:top-[70px] z-30 pt-4 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
                Inventario
                <span className="text-slate-400 text-lg font-normal">({stats.total})</span>
              </h1>
              <p className="hidden md:block text-slate-500 mt-1">Gestiona tu catálogo de productos</p>
            </div>

            {/* Stats Removed as requested */}
          </div>

          {/* TOOLBAR */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative md:w-56">
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <IoFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <button
                onClick={abrirCrear}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition active:scale-95 flex items-center gap-2 whitespace-nowrap"
              >
                <IoAdd size={20} />
                <span className="hidden sm:inline">Nuevo Producto</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {cargandoProductos ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 h-64 animate-pulse border border-slate-100">
                <div className="bg-slate-200 w-full aspect-square rounded-lg mb-3" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <IoCubeOutline size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No se encontraron productos</h3>
            <p className="text-slate-500 mt-2 max-w-sm">
              Intenta con otra búsqueda o agrega un nuevo producto a tu inventario.
            </p>
            {(busqueda || filtroCategoria) && (
              <button
                onClick={() => { setBusqueda(""); setFiltroCategoria(""); }}
                className="mt-6 text-indigo-600 font-medium hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {productosFiltrados.map(p => {
              const sinStock = p.stock === 0;
              const pocoStock = p.stock > 0 && p.stock <= 5;

              return (
                <div
                  key={p.id}
                  className={`group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col relative
                    ${sinStock ? "opacity-75 grayscale-[0.5]" : ""}
                  `}
                >
                  {/* Imagen y Badges */}
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <IoImageOutline size={32} />
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {pocoStock && <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Poco Stock</span>}
                      {p.is_featured && <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Destacado</span>}
                    </div>
                    {sinStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-black/80 text-white text-xs font-bold px-3 py-1 rounded-full">AGOTADO</span>
                      </div>
                    )}

                    {/* Botones de acción on hover (Desktop) */}
                    <div className="hidden md:flex absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity gap-2 justify-center bg-gradient-to-t from-black/50 to-transparent pt-8">
                      <button
                        onClick={() => abrirEditar(p)}
                        className="p-2 bg-white text-slate-700 rounded-full hover:bg-indigo-500 hover:text-white shadow-lg transition-colors"
                        title="Editar"
                      >
                        <IoPencil size={16} />
                      </button>
                      <button
                        onClick={() => setProductoAEliminar(p.id)}
                        className="p-2 bg-white text-rose-600 rounded-full hover:bg-rose-500 hover:text-white shadow-lg transition-colors"
                        title="Eliminar"
                      >
                        <IoTrashBin size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2 flex flex-col flex-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                      {catMap[p.categoria_id] || "Sin Categoría"}
                    </span>
                    <h3 className="font-semibold text-slate-800 text-xs leading-tight line-clamp-2 mb-1.5" title={p.nombre}>
                      {p.nombre}
                    </h3>

                    <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-1.5">
                      <span className="text-base font-bold text-slate-900">
                        ${p.precio.toLocaleString()}
                      </span>
                      <span className={`text-[10px] font-medium ${sinStock ? 'text-rose-500' : 'text-slate-500'}`}>
                        Stock: {p.stock}
                      </span>
                    </div>

                    {/* Botones Mobile (Siempre visibles) */}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex gap-1.5 md:hidden">
                      <button
                        onClick={() => abrirEditar(p)}
                        className="flex-1 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 active:bg-indigo-100"
                      >
                        <IoPencil size={12} /> Editar
                      </button>
                      <button
                        onClick={() => setProductoAEliminar(p.id)}
                        className="flex-1 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 active:bg-rose-100"
                      >
                        <IoTrashBin size={12} /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* === MODAL CREAR / EDITAR === */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {formProducto.id ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button onClick={cerrar} className="text-slate-400 hover:text-slate-600">
                <IoClose size={24} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna Izquierda: Datos */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Producto</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formProducto.nombre}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Ej. Café Molido 500g"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Precio</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                          type="number"
                          name="precio"
                          value={formProducto.precio}
                          onChange={handleChange}
                          className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Stock</label>
                      <input
                        type="number"
                        name="stock"
                        value={formProducto.stock}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Categoría</label>
                    <select
                      name="categoria_id"
                      value={formProducto.categoria_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                    >
                      <option value="">Seleccionar...</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <input
                      type="checkbox"
                      id="is_featured"
                      name="is_featured"
                      checked={formProducto.is_featured}
                      onChange={handleChange}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="is_featured" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                      Destacar este producto
                    </label>
                  </div>
                </div>

                {/* Columna Derecha: Imagen */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Imagen</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center h-64 relative bg-slate-50 group transition-all hover:bg-slate-100">
                    {(imagenFile || formProducto.imagen_url) ? (
                      <>
                        <img
                          src={imagenFile ? URL.createObjectURL(imagenFile) : formProducto.imagen_url}
                          alt="Preview"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <button
                          onClick={removeImageNow}
                          className="absolute top-2 right-2 z-20 bg-white text-rose-500 p-2 rounded-full shadow-md hover:bg-rose-50 transition"
                        >
                          <IoTrashBin />
                        </button>
                      </>
                    ) : (
                      <div className="py-8">
                        <IoCloudUploadOutline size={48} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500 font-medium">Arrastra una imagen aquí</p>
                        <p className="text-xs text-slate-400 mt-1">o haz click para seleccionar</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImagenFile(e.target.files?.[0])}
                      className={`absolute inset-0 opacity-0 cursor-pointer ${ (imagenFile || formProducto.imagen_url) ? 'pointer-events-none' : '' }`}
                      disabled={!!(imagenFile || formProducto.imagen_url)}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">Recomendado: 500x500px, WebP/JPG/PNG</p>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={cerrar}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <IoSaveOutline size={18} /> Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL ELIMINAR === */}
      {productoAEliminar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoAlertCircleOutline size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar producto?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Estás a punto de eliminar este producto. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setProductoAEliminar(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminacion}
                className="px-4 py-2 rounded-xl bg-rose-600 font-medium text-white hover:bg-rose-700 shadow-md"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}