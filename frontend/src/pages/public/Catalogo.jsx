import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { createPortal } from "react-dom";
import { obtenerProductos } from "../../lib/productos";
import { obtenerCategorias } from "../../lib/categorias";
import CarritoFlotante from "../../components/CarritoFlotante";
import toast from "react-hot-toast";
import { IoCheckmarkCircleOutline, IoAlertCircleOutline, IoSearch, IoGrid, IoClose } from "react-icons/io5";

import BannerOfertas from "../../components/BannerOfertas";

// Componente de Skeleton para tarjetas de producto
function ProductoSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200"></div>
      <div className="p-3 pt-2 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>
        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-xl mt-3"></div>
      </div>
    </div>
  );
}

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const busqueda = searchParams.get("q") || "";
  const categoriaUrl = searchParams.get("categoria") || "";
  const [carrito, setCarrito] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("carrito");
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];
        // Normalizar y validar items para evitar datos corruptos en localStorage
        return parsed
          .map((p) => ({
            id: p?.id ?? null,
            nombre: p?.nombre ?? p?.title ?? "",
            precio: Number(p?.precio ?? p?.price ?? 0) || 0,
            cantidad: Number(p?.cantidad ?? p?.qty ?? 1) || 1,
            imagen_url: p?.imagen_url ?? p?.image_url ?? null,
            stock: Number(p?.stock ?? 0) || 0,
          }))
          .filter((p) => p.id !== null && p.nombre !== "");
      } catch (error) {
        console.error("Error al cargar carrito:", error);
        return [];
      }
    }
    return [];
  });
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

    const channel = supabase
      .channel("productos_catalogo")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "productos" },
        () => {
          obtenerProductos().then(setProductos);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }, [carrito]);

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = categoriaUrl === "" || p.categoria_id === Number(categoriaUrl);
      return coincideTexto && coincideCategoria;
    });
  }, [productos, busqueda, categoriaUrl]);

  // Productos visibles según la página actual
  const productosVisibles = useMemo(() => {
    return productosFiltrados.slice(0, paginaActual * PRODUCTOS_POR_PAGINA);
  }, [productosFiltrados, paginaActual]);

  const hayMasProductos = productosVisibles.length < productosFiltrados.length;

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [busqueda, categoriaUrl]);

  // Intersection Observer para cargar más productos automáticamente
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hayMasProductos && !cargandoMas && !cargando) {
          setCargandoMas(true);
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
    // Haptic Feedback (Vibración táctil) para móviles
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    const existe = carrito.find((p) => p.id === producto.id);

    if (existe) {
      if (existe.cantidad + 1 > producto.stock) {
        toast.error(`Stock insuficiente para "${producto.nombre}"`, { icon: <IoAlertCircleOutline size={22} /> });
        return;
      }
      setCarrito((prev) =>
        prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
      toast.success(`"${producto.nombre}" +1 agregado al carrito`);
    } else {
      if (producto.stock < 1) {
        toast.error(`No hay stock disponible de "${producto.nombre}"`, { icon: <IoAlertCircleOutline size={22} /> });
        return;
      }
      setCarrito((prev) => [...prev, { ...producto, cantidad: 1 }]);
      toast.success(`"${producto.nombre}" agregado al carrito`);
    }
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito((prev) => prev.filter((p) => p.id !== productoId));
      toast.success("Producto eliminado del carrito");
    } else {
      const productoEnCarrito = carrito.find((p) => p.id === productoId);
      const productoOriginal = productos.find((p) => p.id === productoId);

      if (productoEnCarrito && productoOriginal) {
        if (nuevaCantidad > productoOriginal.stock) {
          toast.error(`Stock insuficiente para "${productoOriginal.nombre}"`, { icon: <IoAlertCircleOutline size={22} /> });
          return;
        }
        setCarrito((prev) =>
          prev.map((p) =>
            p.id === productoId ? { ...p, cantidad: nuevaCantidad } : p
          )
        );
        toast.success(`Cantidad de "${productoOriginal.nombre}" actualizada`);
      }
    }
  };

  return (
    <div className="bg-gray-50/50 min-h-screen pb-20">

      {/* Breadcrumb / Minimalist Header */}
      {categoriaUrl && catMap[categoriaUrl] && (
        <div className="pt-2 md:pt-0 px-4 md:px-8 lg:px-12 pb-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Catálogo</span>
            <span className="text-gray-300">/</span>
            <span className="font-bold text-gray-900">{catMap[categoriaUrl]}</span>

            <button
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("categoria");
                setSearchParams(newParams);
              }}
              className="ml-2 text-red-500 hover:text-red-700 text-xs font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              (Limpiar)
            </button>
          </div>
        </div>
      )}

      {/* Contenedor del Grid de Productos (Fluid Width) */}
      <div id="catalogo" className={`w-full px-4 md:px-8 lg:px-12 ${categoriaUrl ? 'pt-4' : 'pt-4'}`}>

        {/* Banner de Ofertas (Solo si no hay categoría seleccionada ni búsqueda y no está cargando) */}
        {!cargando && !categoriaUrl && !busqueda && productos.some(p => p.is_featured) && (
          <div className="-mt-16 md:-mt-20 mb-8">
            <BannerOfertas productos={productos} agregarAlCarrito={agregarAlCarrito} />
          </div>
        )}

        {cargando ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <ProductoSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {productosVisibles.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {productosVisibles.map((producto) => {
                  const enCarrito = carrito.find((item) => item.id === producto.id);
                  const cantidad = enCarrito ? enCarrito.cantidad : 0;
                  const estaAgotado = producto.stock === 0;
                  const pocoStock = producto.stock > 0 && producto.stock <= 5;

                  return (
                    <article
                      key={producto.id}
                      className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-400 flex flex-col h-full
                        ${estaAgotado
                          ? "opacity-65 grayscale"
                          : "shadow-xl hover:shadow-2xl hover:-translate-y-2 ring-1 ring-gray-100"
                        }`}
                    >
                      {/* Imagen */}
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 sm:aspect-square">
                        {producto.imagen_url ? (
                          <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <span className="text-4xl">☕</span>
                          </div>
                        )}

                        {/* Badge categoría */}
                        <span className={`absolute top-3 left-3 px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow-lg z-10
                                max-w-[100px] sm:max-w-[120px] md:max-w-[150px] lg:max-w-none truncate
                          ${producto.categoria_id === 1 ? "bg-orange-500" :
                            producto.categoria_id === 2 ? "bg-emerald-600" :
                              producto.categoria_id === 3 ? "bg-sky-600" :
                                producto.categoria_id === 4 ? "bg-amber-600" :
                                  producto.categoria_id === 5 ? "bg-yellow-600" :
                                    producto.categoria_id === 6 ? "bg-lime-600" :
                                      producto.categoria_id === 7 ? "bg-green-600" :
                                        producto.categoria_id === 8 ? "bg-violet-600" :
                                          producto.categoria_id === 9 ? "bg-pink-600" : "bg-purple-600"}`}>
                          {catMap[producto.categoria_id] || "General"}
                        </span>

                        {pocoStock && (
                          <span className="absolute bottom-3 right-1 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-xl animate-pulse z-10">
                            ¡Solo Quedan {producto.stock}!
                          </span>
                        )}

                        {estaAgotado && (
                          <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                            <span className="bg-red-600 text-white font-black text-2xl px-8 py-3 rounded-2xl shadow-2xl">AGOTADO</span>
                          </div>
                        )}
                      </div>

                      {/* Texto y precio */}
                      <div className="p-3 pb-2 sm:p-5 sm:pb-3 flex flex-col flex-1">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-lg leading-snug sm:leading-tight line-clamp-3 min-h-[3.5rem] sm:min-h-0">
                          {producto.nombre}
                        </h3>
                        <div className="mt-auto pt-2 sm:pt-3">
                          <span className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700">
                            ${parseFloat(producto.precio).toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>

                      {/* BOTÓN */}
                      {!estaAgotado ? (
                        <div className="px-3 pb-3 sm:px-5 sm:pb-5 mt-auto">
                          {cantidad === 0 ? (
                            <button
                              onClick={() => agregarAlCarrito(producto)}
                              className="w-full flex items-center justify-center gap-2 sm:gap-3 cursor-pointer
                                bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl sm:rounded-2xl
                                shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl active:scale-98 transition-all duration-300
                                py-2.5 text-xs sm:py-3 sm:text-sm md:text-base"
                            >
                              <span className="tracking-wide">AGREGAR</span>
                            </button>
                          ) : (
                            <div className="flex items-center bg-gray-100 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-inner">
                              <button
                                onClick={() => actualizarCantidad(producto.id, cantidad - 1)}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-lg sm:rounded-xl shadow-sm text-purple-700 hover:bg-purple-50 transition-colors"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="flex-1 text-center font-black text-gray-800 text-sm sm:text-lg select-none">
                                {cantidad}
                              </span>
                              <button
                                onClick={() => agregarAlCarrito(producto)}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-purple-600 rounded-lg sm:rounded-xl shadow-lg shadow-purple-200 text-white hover:bg-purple-700 transition-transform active:scale-90"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="px-3 pb-3 sm:px-5 sm:pb-5 mt-auto opacity-0 pointer-events-none">
                          <div className="h-10 sm:h-12" />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="col-span-full py-12 md:py-20 text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 transform rotate-12">
                  <IoSearch className="text-4xl text-indigo-500" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">No encontramos lo que buscas</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Intenta con otra palabra clave o selecciona la categoría "Ver todo".
                </p>
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("categoria");
                    newParams.delete("q");
                    setSearchParams(newParams);
                  }}
                  className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Ver todo el menú
                </button>
              </div>
            )}

            {/* Spinner Infinite Scroll */}
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

            {!cargando && productosVisibles.length > 0 && !hayMasProductos && productosFiltrados.length > PRODUCTOS_POR_PAGINA && (
              <div className="text-center py-8 text-gray-500 text-sm border-t border-gray-200 mt-6">
                ✓ Has visto todos los productos disponibles
              </div>
            )}
          </div>
        )}
      </div>

      <CarritoFlotante carrito={carrito} setCarrito={setCarrito} />
    </div>
  );
}