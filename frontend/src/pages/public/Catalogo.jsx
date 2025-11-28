import { useEffect, useState, useMemo } from "react";
import { obtenerProductos } from "../../lib/productos";
import { obtenerCategorias } from "../../lib/categorias";
import CarritoFlotante from "../../components/CarritoFlotante";

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [carrito, setCarrito] = useState([]);

  // Cargar productos y categorías
  useEffect(() => {
    async function cargarDatos() {
      const prods = await obtenerProductos();
      const cats = await obtenerCategorias();
      setProductos(prods);
      setCategorias(cats);
      setCatMap(Object.fromEntries(cats.map(c => [c.id, c.nombre])));
    }
    cargarDatos();
  }, []);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const carritoGuardado = localStorage.getItem("carrito");
    if (carritoGuardado) setCarrito(JSON.parse(carritoGuardado));
  }, []);

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }, [carrito]);

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = filtroCategoria === "" || p.categoria_id === Number(filtroCategoria);
      return coincideTexto && coincideCategoria;
    });
  }, [productos, busqueda, filtroCategoria]);

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(p => p.id === producto.id);
    if (existe) {
      if (existe.cantidad + 1 > producto.stock) {
        alert(`No hay suficiente stock de ${producto.nombre}`);
        return;
      }
      setCarrito(prev =>
        prev.map(p =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
    } else {
      if (producto.stock < 1) {
        alert(`No hay stock disponible de ${producto.nombre}`);
        return;
      }
      setCarrito(prev => [...prev, { ...producto, cantidad: 1 }]);
    }
  };

  return (
    <div className="p-4 md:p-10 bg-gray-50/50 border-b min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 pt-5">Nuestros Productos</h1>

      {/* Filtros elegantes */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Buscador */}
        <div className="relative flex-1 max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl shadow-sm 
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                      transition-all duration-200 text-gray-900 placeholder-gray-400
                      focus:outline-none"
          />
          {/* Limpieza rápida si hay texto */}
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Selector de categoría */}
        <div className="relative">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-xl px-5 py-3.5 pr-12 
                      shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                      transition-all duration-200 text-gray-900 font-medium
                      focus:outline-none cursor-pointer w-full lg:w-64"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {/* Flecha personalizada */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

      </div>

      {/* Opcional: mostrar resultados encontrados */}
      {productosFiltrados.length !== productos.length && (
        <div className="mb-4 text-sm text-gray-600">
          Mostrando <span className="font-semibold text-indigo-600">{productosFiltrados.length}</span> de{" "}
          <span className="font-semibold">{productos.length}</span> productos
        </div>
      )}

      {/* Productos */}
     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4 py-6">
  {productosFiltrados.map((p) => {
    const estaAgotado = p.stock === 0;
    const pocoStock = p.stock > 0 && p.stock <= 5;

    return (
      <article
        key={p.id}
        className={`group relative bg-white rounded-2xl transition-all duration-300 overflow-hidden 
          ${estaAgotado 
            ? "opacity-60 grayscale" 
            : "shadow-lg hover:shadow-2xl hover:-translate-y-1" // Elegante elevación y sombra en hover
          }`}
      >
        {/* IMAGEN Y BOTÓN FLOTANTE */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {p.imagen_url ? (
            <img
              src={p.imagen_url}
              alt={p.nombre}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 text-xs font-medium">Sin imagen</div>
          )}

          {/* OVERLAY SUTIL EN HOVER PARA LA IMAGEN */}
          {!estaAgotado && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          )}

          {/* Badge poco stock */}
          {pocoStock && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg z-10">
              ¡Solo quedan {p.stock}!
            </span>
          )}

          {/* Agotado */}
          {estaAgotado && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <span className="text-white font-bold text-lg tracking-wider border-2 border-white px-3 py-1.5 rounded-lg">AGOTADO</span>
            </div>
          )}

          {/* BOTÓN FLOTANTE DE AÑADIR (Más prominente y con degradado) */}
          {!estaAgotado && (
            <button
              onClick={() => agregarAlCarrito(p)}
              className="absolute bottom-3 right-3 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-xl flex items-center justify-center 
                         text-white text-2xl font-bold opacity-0 group-hover:opacity-100 group-hover:bottom-4 
                         transition-all duration-300 active:scale-90 z-10"
              aria-label="Agregar al carrito"
            >
              +
            </button>
          )}
        </div>

        {/* CONTENIDO DE TEXTO (P-3) */}
        <div className="p-3 pt-2 space-y-1 flex flex-col justify-between h-auto">
          <div>
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1">
              {catMap[p.categoria_id] || "General"}
            </p>

            <h3 className="font-semibold text-gray-900 line-clamp-2 text-base leading-snug min-h-[3rem]" title={p.nombre}>
              {p.nombre}
            </h3>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
            {/* Precio impactante con tu paleta de colores */}
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-700">
              ${parseFloat(p.precio).toLocaleString("es-AR")}
            </span>
          </div>

          {/* BOTÓN PRINCIPAL (Con degradado y efecto hover/active) */}
          <button
            onClick={() => !estaAgotado && agregarAlCarrito(p)}
            disabled={estaAgotado}
            className={`w-full mt-3 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg 
              ${estaAgotado
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-700 text-white hover:from-indigo-700 hover:to-purple-800 active:scale-[0.98] active:shadow-md"
              }`}
          >
            {estaAgotado ? "Agotado" : "Añadir al carrito "}
          </button>
        </div>
      </article>
    );
  })}
</div>

      {/* Carrito siempre activo */}
      <CarritoFlotante carrito={carrito} setCarrito={setCarrito} />
    </div>
  );
}
