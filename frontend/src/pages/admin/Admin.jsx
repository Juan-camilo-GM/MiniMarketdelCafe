import { IoSaveOutline, IoTrashBin, IoClose, IoCloseCircle } from "react-icons/io5";
import { useEffect, useState, useMemo } from "react";
import {
  obtenerProductos,
  agregarProducto,
  actualizarProducto,
  eliminarProducto
} from "../../lib/productos";
import { obtenerCategorias } from "../../lib/categorias";
import { subirImagen } from "../../lib/storage";
import { supabase } from "../../lib/supabase";

const deleteOldImage = async (url) => {
  if (!url) return;
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (!match) return;
    const path = match[1];
    console.log("[deleteOldImage] Eliminando:", path);
    const { error } = await supabase.storage.from("productos").remove([path]);
    if (error) console.error("Error borrando imagen:", error);
  } catch (err) {
    console.error("Excepción borrando imagen:", err);
  }
};

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [formProducto, setFormProducto] = useState({
    id: null,
    nombre: "",
    precio: "",
    stock: "",
    categoria_id: "",
    imagen_url: null
  });
  const [imagenFile, setImagenFile] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar productos y categorías al montar
  useEffect(() => {
    async function cargarTodo() {
      const prods = await obtenerProductos();
      const cats = await obtenerCategorias();
      setProductos(prods || []);
      setCategorias(cats || []);
      setCatMap(Object.fromEntries((cats || []).map(c => [c.id, c.nombre])));
    }
    cargarTodo();
  }, []);

  // Abrir modal crear
  const abrirCrear = () => {
    setFormProducto({ id: null, nombre: "", precio: "", stock: "", categoria_id: "", imagen_url: null });
    setImagenFile(null);
    setIsOpen(true);
  };

  // Abrir modal editar
  const abrirEditar = (p) => {
    setFormProducto({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock,
      categoria_id: p.categoria_id || p.categorias?.id || "",
      imagen_url: p.imagen_url || null
    });
    setImagenFile(null);
    setIsOpen(true);
  };

  // Cerrar modal
  const cerrar = () => {
    setIsOpen(false);
    setFormProducto({ id: null, nombre: "", precio: "", stock: "", categoria_id: "", imagen_url: null });
    setImagenFile(null);
    setLoading(false);
  };

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormProducto(prev => ({ ...prev, [name]: value }));
  };

  // Guardar producto (crear o actualizar)
  const guardar = async () => {
    try {
      setLoading(true);
      let imagen_url = formProducto.imagen_url;

      if (imagenFile) {
        if (formProducto.imagen_url) await deleteOldImage(formProducto.imagen_url);
        const url = await subirImagen(imagenFile);
        if (url) imagen_url = url;
      }

      const datos = {
        nombre: formProducto.nombre,
        precio: Number(formProducto.precio || 0),
        stock: Number(formProducto.stock || 0),
        categoria_id: Number(formProducto.categoria_id) || null,
        imagen_url
      };

      if (formProducto.id) {
        const actualizado = await actualizarProducto(formProducto.id, datos);
        const conCategoria = {
          ...actualizado,
          categorias: { id: actualizado.categoria_id, nombre: catMap[actualizado.categoria_id] || "" }
        };
        setProductos(prev => prev.map(p => p.id === conCategoria.id ? conCategoria : p));
      } else {
        const agregado = await agregarProducto(datos);
        const conCategoria = {
          ...agregado,
          categorias: { id: agregado.categoria_id, nombre: catMap[agregado.categoria_id] || "" }
        };
        setProductos(prev => [...prev, conCategoria]);
      }

      cerrar();
    } catch (e) {
      console.error(e);
      alert(e.message || "Error al guardar el producto");
      setLoading(false);
    }
  };

  // Eliminar producto
  const borrar = async (id) => {
    if (!window.confirm("¿Seguro que querés eliminar este producto?")) return;
    try {
      await eliminarProducto(id);
      setProductos(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert("Error al eliminar el producto");
    }
  };

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const texto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const categoria = filtroCategoria === "" || p.categoria_id === Number(filtroCategoria);
      return texto && categoria;
    });
  }, [productos, busqueda, filtroCategoria]);

  return (
    <>
      {/* ==================== PÁGINA PRINCIPAL ==================== */}
      <div className="p-4 md:p-10 bg-gray-50/50 border-b border-gray-200 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestión de Productos</h1>

        {/* Filtros y botón agregar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center mb-8">
          <div className="relative flex-1 max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder-gray-400"
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-xl px-5 py-3.5 pr-12 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium cursor-pointer w-full lg:w-64"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {(busqueda || filtroCategoria) && (
            <button onClick={() => { setBusqueda(""); setFiltroCategoria(""); }} className="px-5 py-3.5 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition">
              Limpiar filtros
            </button>
          )}

          <button onClick={abrirCrear} className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 transition-all active:scale-95">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Agregar producto
          </button>
        </div>

        {/* Contador */}
        {productosFiltrados.length !== productos.length && (
          <div className="mb-6 text-sm text-gray-600">
            Mostrando <span className="font-bold text-indigo-600">{productosFiltrados.length}</span> de <span className="font-bold">{productos.length}</span> productos
          </div>
        )}

        {/* Grid de productos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {productosFiltrados.map((p) => {
            const sinStock = p.stock === 0;
            const pocoStock = p.stock > 0 && p.stock <= 5;

            return (
              <div key={p.id} className={`group relative bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 transition-all duration-250 hover:border-indigo-300 hover:-translate-y-1 ${sinStock ? "opacity-70" : ""}`}>
                <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-t-xl">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 text-xs font-medium">Sin imagen</div>
                  )}
                  {pocoStock && <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">¡Solo quedan {p.stock}!</div>}
                  {sinStock && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-bold text-sm">AGOTADO</span></div>}
                </div>

                <div className="p-3 space-y-2">
                  <p className="text-xs text-indigo-600 font-medium truncate">{p.categorias?.nombre || "Sin categoría"}</p>
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug">{p.nombre}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-gray-900">${parseFloat(p.precio).toLocaleString("es-AR")}</span>
                    <span className={`font-medium ${pocoStock ? "text-red-600" : "text-gray-600"}`}>Stock: {p.stock}</span>
                  </div>
                  <div className="flex gap-1.5 pt-2 border-t border-gray-100">
                    <button onClick={() => abrirEditar(p)} className="flex-1 bg-indigo-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition">Editar</button>
                    <button onClick={() => borrar(p.id)} className="flex-1 bg-red-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-red-700 active:scale-95 transition">Eliminar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================== MODAL CREAR / EDITAR PRODUCTO ==================== */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 text-center relative">
              <h2 className="text-2xl font-bold">
                {formProducto.id ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button onClick={cerrar} disabled={loading} className="absolute top-5 right-5 bg-white/20 hover:bg-white/30 rounded-full p-2 transition">
                <IoClose className="text-2xl" />
              </button>
            </div>

            {/* Formulario */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Campos */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                    <input name="nombre" type="text" value={formProducto.nombre} onChange={handleChange}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="Leche Colanta" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Precio</label>
                      <input name="precio" type="number" value={formProducto.precio} onChange={handleChange}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
                      <input name="stock" type="number" value={formProducto.stock} onChange={handleChange}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                    <select name="categoria_id" value={formProducto.categoria_id} onChange={handleChange}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer font-medium">
                      <option value="">Selecciona categoría</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                </div>

                {/* Imagen */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Imagen del producto</label>

                  {(formProducto.imagen_url || imagenFile) && (
                    <div className="relative mb-5 group">
                      <img
                        src={imagenFile ? URL.createObjectURL(imagenFile) : formProducto.imagen_url}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-2xl shadow-xl border-4 border-white"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (formProducto.imagen_url) await deleteOldImage(formProducto.imagen_url);
                          setImagenFile(null);
                          setFormProducto(prev => ({ ...prev, imagen_url: null }));
                        }}
                        className="absolute -top-3 -right-3 bg-white rounded-full shadow-2xl p-2 hover:scale-110 transition"
                      >
                        <IoCloseCircle className="text-3xl text-red-500" />
                      </button>
                    </div>
                  )}

                  <label htmlFor="subir-imagen-producto" className="block cursor-pointer">
                    <input
                      id="subir-imagen-producto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImagenFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all
                      ${imagenFile || formProducto.imagen_url ? "border-indigo-400 bg-indigo-50" : "border-gray-300 bg-gray-50 hover:border-indigo-500 hover:bg-indigo-50"}`}>
                      <svg className="w-14 h-14 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="font-medium text-gray-700">
                        {imagenFile || formProducto.imagen_url ? "Cambiar imagen" : "Haz clic o arrastra aquí"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP · Máx 5 MB</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="border-t bg-gray-50 px-6 py-5">
              <div className="flex justify-end gap-4">
                <button onClick={cerrar} disabled={loading} className="px-6 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={loading} className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold shadow-lg hover:shadow-xl active:scale-98 transition flex items-center gap-3">
                  {loading ? "Guardando..." : "Guardar producto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}