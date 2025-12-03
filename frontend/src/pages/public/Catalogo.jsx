import { useEffect, useState, useMemo, useRef } from "react";
import { obtenerProductos } from "../../lib/productos";
import { obtenerCategorias } from "../../lib/categorias";
import CarritoFlotante from "../../components/CarritoFlotante";
import toast from "react-hot-toast";
import { IoCheckmarkCircleOutline, IoAlertCircleOutline } from "react-icons/io5";

// Componente de Skeleton para tarjetas de producto
function ProductoSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      {/* Imagen skeleton */}
      <div className="aspect-square bg-gray-200"></div>
      
      {/* Contenido skeleton */}
      <div className="p-3 pt-2 space-y-3">
        {/* Categoría */}
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        
        {/* Título */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>
        
        {/* Precio */}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
        
        {/* Botón */}
        <div className="h-10 bg-gray-200 rounded-xl mt-3"></div>
      </div>
    </div>
  );
}

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para paginación infinita
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargandoMas, setCargandoMas] = useState(false);
  const PRODUCTOS_POR_PAGINA = 24;
  
  const observerTarget = useRef(null);

  // Cargar productos y categorías
  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
        const prods = await obtenerProductos();
        const cats = await obtenerCategorias();
        setProductos(prods);
        setCategorias(cats);
        setCatMap(Object.fromEntries(cats.map(c => [c.id, c.nombre])));
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
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

  // Productos visibles según la página actual
  const productosVisibles = useMemo(() => {
    return productosFiltrados.slice(0, paginaActual * PRODUCTOS_POR_PAGINA);
  }, [productosFiltrados, paginaActual]);

  const hayMasProductos = productosVisibles.length < productosFiltrados.length;

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroCategoria]);

  // Intersection Observer para cargar más productos automáticamente
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hayMasProductos && !cargandoMas && !cargando) {
          setCargandoMas(true);
          // Simular delay de carga para mejor UX
          setTimeout(() => {
            setPaginaActual(prev => prev + 1);
            setCargandoMas(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hayMasProductos, cargandoMas, cargando]);

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find((p) => p.id === producto.id);

    if (existe) {
      // Ya está en el carrito → ¿podemos sumar uno más?
      if (existe.cantidad + 1 > producto.stock) {
        toast.error(
          `Stock insuficiente para "${producto.nombre}"`,
          {
            icon: <IoAlertCircleOutline size={22} />,
            duration: 5000,
          }
        );
        return;
      }

      // Sumamos uno
      setCarrito((prev) =>
        prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );

      toast.success(`"${producto.nombre}" +1 agregado al carrito`, {
        icon: <IoCheckmarkCircleOutline size={22} />,
        duration: 3000,
      });
    } else {
      // Es nuevo en el carrito
      if (producto.stock < 1) {
        toast.error(`No hay stock disponible de "${producto.nombre}"`, {
          icon: <IoAlertCircleOutline size={22} />,
          duration: 5000,
        });
        return;
      }

      // Lo agregamos con cantidad 1
      setCarrito((prev) => [...prev, { ...producto, cantidad: 1 }]);

      toast.success(`"${producto.nombre}" agregado al carrito`, {
        icon: <IoCheckmarkCircleOutline size={22} />,
        duration: 3000,
      });
    }
  };

  return (
    <div className="p-4 md:p-10 bg-gray-50/50 border-b min-h-screen">
      <h1 className="text-5xl md:text-7xl font-black mb-12 pt-8 leading-tight tracking-tight">
        {/* Palabra principal con gradiente púrpura-índigo exacto */}
        <span className="text-transparent bg-clip-text 
                        bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-700
                        drop-shadow-[0_0_25px_rgba(139,92,246,0.45)]">
          Fresco
        </span>

        {/* Palabra secundaria en color sólido oscuro para máximo contraste */}
        <span className="text-gray-900">Vecino</span>

        {/* Subtítulo – elige el que más te represente */}
        <br />
        <span className="text-3xl md:text-4xl font-bold text-purple-300 block mt-3">
          Calidad y precio que te conviene
        </span>
      </h1>
      {/* Filtros elegantes */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Buscador */}
        <div className="relative flex-1 max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="¿Qué estás buscando?"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            disabled={cargando}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl shadow-sm 
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                      transition-all duration-200 text-gray-900 placeholder-gray-400
                      focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
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
            disabled={cargando}
            className="appearance-none bg-white border border-gray-200 rounded-xl px-5 py-3.5 pr-12 
                      shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                      transition-all duration-200 text-gray-900 font-medium
                      focus:outline-none cursor-pointer w-full lg:w-64 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      {!cargando && productosFiltrados.length !== productos.length && (
        <div className="mb-4 text-sm text-gray-600">
          Mostrando <span className="font-semibold text-indigo-600">{productosVisibles.length}</span> de{" "}
          <span className="font-semibold">{productosFiltrados.length}</span> productos
        </div>
      )}

      {/* Grid de productos o skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4 py-6">
        {cargando ? (
          // Mostrar 12 skeletons mientras carga
          Array.from({ length: 12 }).map((_, i) => (
            <ProductoSkeleton key={i} />
          ))
        ) : productosFiltrados.length === 0 ? (
          // Mensaje cuando no hay resultados
          <div className="col-span-full text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">No se encontraron productos</p>
            <p className="text-gray-400 text-sm mt-2">Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          // Mostrar productos
          productosVisibles.map((p) => {
            const estaAgotado = p.stock === 0;
            const pocoStock = p.stock > 0 && p.stock <= 5;

            return (
              <article
                key={p.id}
                className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-400 flex flex-col h-full
                  ${estaAgotado 
                    ? "opacity-65 grayscale" 
                    : "shadow-xl hover:shadow-2xl hover:-translate-y-2 ring-1 ring-gray-100"
                  }`}
              >
                {/* Imagen */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 sm:aspect-square">
                  <img
                    src={p.imagen_url || "/placeholder.jpg"}
                    alt={p.nombre}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />

                  {/* Badge categoría */}
                  <span className={`absolute top-3 left-3 px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow-lg z-10
                          max-w-[100px] sm:max-w-[120px] md:max-w-[150px] lg:max-w-none truncate
                    ${p.categoria_id === 1 ? "bg-orange-500" :
                      p.categoria_id === 2 ? "bg-emerald-600" :
                      p.categoria_id === 3 ? "bg-sky-600" :
                      p.categoria_id === 4 ? "bg-amber-600" :
                      p.categoria_id === 5 ? "bg-yellow-600" :
                      p.categoria_id === 6 ? "bg-lime-600" :
                      p.categoria_id === 7 ? "bg-green-600" :
                      p.categoria_id === 8 ? "bg-violet-600" :
                      p.categoria_id === 9 ? "bg-pink-600" : "bg-purple-600"}`}>
                    {catMap[p.categoria_id] || "General"}
                  </span>

                  {/* Badge poco stock*/}
                  {pocoStock && (
                    <span className="absolute 
                      bottom-3 right-1 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-xl animate-pulse z-10
                    ">
                      ¡Solo Quedan {p.stock}!
                    </span>
                  )}

                  {/* Badge agotado */}
                  {estaAgotado && (
                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                      <span className="bg-red-600 text-white font-black text-2xl px-8 py-3 rounded-2xl shadow-2xl">
                        AGOTADO
                      </span>
                    </div>
                  )}
                </div>

                {/* Texto y precio */}
                <div className="p-4 pb-3 sm:p-5 sm:pb-3 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight line-clamp-2">
                    {p.nombre}
                  </h3>

                  <div className="mt-2 sm:mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700">
                      ${parseFloat(p.precio).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>

                {/* BOTÓN – Compacto en móvil, grande en escritorio */}
                {!estaAgotado ? (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                    <button
                      onClick={() => agregarAlCarrito(p)}
                      className="
                        w-full flex items-center justify-center gap-2 sm:gap-3 cursor-pointer
                        bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl sm:rounded-2xl
                        shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl active:scale-98 transition-all duration-300
                        
                        /* MÓVIL: estilo compacto y elegante */
                        py-3 text-sm
                        [&>svg]:w-5 [&>svg]:h-5
                        
                        /* Desde sm (640px): diseño premium grande */
                        sm:py-4 sm:text-lg sm:[&>svg]:w-7 sm:[&>svg]:h-7
                      "
                    >
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 3h2l.4 2M7.5 13h9l3.5-8H5.9M7.5 13L5.9 5M7.5 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="hidden xxs:inline">Añadir al carrito</span>
                      <span className="xxs:hidden">Añadir</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                    <button 
                      disabled 
                      className="w-full py-3 sm:py-4 text-sm sm:text-lg font-bold bg-gray-300 text-gray-600 rounded-xl sm:rounded-2xl cursor-not-allowed"
                    >
                      Sin stock
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Loading indicator para cargar más productos */}
      {cargandoMas && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4 pb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductoSkeleton key={`loading-${i}`} />
          ))}
        </div>
      )}

      {/* Elemento observador para infinite scroll */}
      {hayMasProductos && !cargandoMas && !cargando && (
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando más productos...
          </div>
        </div>
      )}

      {/* Mensaje cuando se cargaron todos los productos */}
      {!cargando && productosVisibles.length > 0 && !hayMasProductos && productosFiltrados.length > PRODUCTOS_POR_PAGINA && (
        <div className="text-center py-8 text-gray-500 text-sm border-t border-gray-200 mt-6">
          ✓ Has visto todos los productos disponibles
        </div>
      )}

      {/* Carrito siempre activo */}
      <CarritoFlotante carrito={carrito} setCarrito={setCarrito} />
    </div>
  );
}