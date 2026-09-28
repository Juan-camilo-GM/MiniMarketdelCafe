import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { obtenerProductos } from "../../lib/productos";
import { obtenerCategorias } from "../../lib/categorias";
import CarritoFlotante from "../../components/CarritoFlotante";
import toast from "react-hot-toast";
import { IoAlertCircleOutline, IoSearch, IoGrid, IoChevronForward } from "react-icons/io5";
import CartLoader from "../../components/ui/CartLoader";

import BannerOfertas from "../../components/BannerOfertas";
import useCartStore from "../../store/cartStore";

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

  const { carrito } = useCartStore();
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
    let filtrados = productos.filter(p => {
      const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = categoriaUrl === "" || p.categoria_id === Number(categoriaUrl);
      return coincideTexto && coincideCategoria;
    });

    return filtrados;
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
    const targetEl = observerTarget.current;
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

    if (targetEl) {
      observer.observe(targetEl);
    }

    return () => {
      if (targetEl) {
        observer.unobserve(targetEl);
      }
    };
  }, [hayMasProductos, cargandoMas, cargando]);

  const agregarAlCarrito = (producto) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    const result = useCartStore.getState().agregarProducto(producto);
    if (result) {
      if (result.error) {
         toast.error(result.error, {
            icon: <IoAlertCircleOutline size={22} />,
            duration: 4000,
            id: `stock-${result.id}`,
         });
      } else if (result.success) {
         toast.success(result.success, {
            duration: 3000,
            id: `add-${result.id}`,
         });
      }
    }
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    const result = useCartStore.getState().actualizarCantidad(productoId, nuevaCantidad, productos);
    if (result) {
       if (result.error) {
         toast.error(result.error, {
            icon: <IoAlertCircleOutline size={22} />,
            duration: 4000,
            id: `stock-${result.id}`,
         });
       } else if (result.success) {
         toast.success(result.success, {
            duration: 3000,
            id: nuevaCantidad === 0 ? `remove-${result.id}` : `update-${result.id}`,
         });
       }
    }
  };


  return (
    <div className="bg-gray-50/50 min-h-screen pb-20">
      <div className="max-w-[1600px] mx-auto w-full pt-4 md:pt-8 px-4 md:px-8 lg:px-12">
        
        {/* Layout Flex: Sidebar + Main */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          
          {/* Sidebar Categorías Desktop */}
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <div className="sticky top-28">
              <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    <IoGrid className="text-indigo-500 text-lg" />
                    Categorías
                  </h3>
                </div>
                <nav className="p-3 space-y-1 overflow-y-auto">
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete("categoria");
                      setSearchParams(newParams);
                    }}
                    className={`group w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${!categoriaUrl ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                  >
                    <span className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${!categoriaUrl ? 'bg-white' : 'bg-slate-300 group-hover:bg-indigo-400'} transition-colors`} />
                      Todos los productos
                    </span>
                    {!categoriaUrl && <IoChevronForward className="text-white opacity-80" />}
                  </button>
                  {categorias.map(cat => {
                    const isActive = categoriaUrl === cat.id.toString();
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set("categoria", cat.id);
                          setSearchParams(newParams);
                        }}
                        className={`group w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                      >
                        <span className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-slate-300 group-hover:bg-indigo-400'} transition-colors`} />
                          {cat.nombre}
                        </span>
                        {isActive && <IoChevronForward className="text-white opacity-80" />}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb Mobile & Desktop */}
            <div className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 w-fit">
                {categoriaUrl && catMap[categoriaUrl] ? (
                  <>
                    <span>Catálogo</span>
                    <span className="text-gray-300">/</span>
                    <span className="font-bold text-indigo-600">{catMap[categoriaUrl]}</span>
                    <button
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete("categoria");
                        setSearchParams(newParams);
                      }}
                      className="ml-2 text-red-500 hover:text-red-600 text-xs font-bold hover:underline cursor-pointer"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span className="font-bold text-gray-900">Todos los productos</span>
                )}
              </div>
            </div>

            {/* Contenedor del Grid */}
            <div id="catalogo" className={`w-full ${categoriaUrl ? 'pt-2' : 'pt-2'}`}>
              
              {/* Banner de Ofertas */}
              {!cargando && !categoriaUrl && !busqueda && productos.some(p => p.is_featured) && (
                <div className="mb-8">
                  <BannerOfertas productos={productos} agregarAlCarrito={agregarAlCarrito} />
                </div>
              )}

              {cargando ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5">
                  {[...Array(10)].map((_, i) => (
                    <ProductoSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {productosVisibles.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5">
                      {productosVisibles.map((producto) => {
                        const enCarrito = carrito.find((item) => item.id === producto.id);
                  const cantidad = enCarrito ? enCarrito.cantidad : 0;
                  const estaAgotado = producto.stock === 0;
                  const pocoStock = producto.stock > 0 && producto.stock <= 5;
                  const esCombo = producto.nombre.toLowerCase().startsWith('combo') || producto.nombre.toLowerCase().startsWith('kit');

                  return (
                    <article
                      key={producto.id}
                      className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-400 flex flex-col h-full
                        ${estaAgotado
                          ? "opacity-65 grayscale"
                          : esCombo
                            ? "shadow-md hover:shadow-xl hover:-translate-y-1 ring-2 ring-rose-400 shadow-rose-500/20"
                            : "shadow-md hover:shadow-xl hover:-translate-y-1 ring-1 ring-gray-100"
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

                        {/* Badge Combo */}
                        {esCombo && (
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full shadow-lg z-10 animate-bounce">
                            🎁 COMBO
                          </div>
                        )}

                        {/* Badge categoría */}
                        <span className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-white text-[10px] sm:text-xs font-bold shadow-md z-10
                                max-w-[90px] sm:max-w-[110px] truncate
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
                      <div className="p-3 pb-2 flex flex-col flex-1">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 min-h-[2.5rem]">
                          {producto.nombre}
                        </h3>
                        <div className="mt-auto pt-2">
                          <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700">
                            ${parseFloat(producto.precio).toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>

                      {/* BOTÓN */}
                      {!estaAgotado ? (
                        <div className="px-3 pb-3 mt-auto">
                          {cantidad === 0 ? (
                            <button
                              onClick={() => agregarAlCarrito(producto)}
                              className="w-full flex items-center justify-center gap-2 cursor-pointer
                                bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg sm:rounded-xl
                                shadow-sm hover:shadow-md active:scale-95 transition-all duration-200
                                py-2 text-xs sm:text-sm"
                            >
                              <span className="tracking-wide">AGREGAR</span>
                            </button>
                          ) : (
                            <div className="flex items-center bg-gray-100 rounded-lg sm:rounded-xl p-1 shadow-inner">
                              <button
                                onClick={() => actualizarCantidad(producto.id, cantidad - 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white rounded-md sm:rounded-lg shadow-sm text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="flex-1 text-center font-bold text-gray-800 text-sm select-none">
                                {cantidad}
                              </span>
                              <button
                                onClick={() => agregarAlCarrito(producto)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-purple-600 rounded-md sm:rounded-lg shadow-md shadow-purple-200 text-white hover:bg-purple-700 transition-transform active:scale-95 cursor-pointer"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="px-3 pb-3 mt-auto opacity-0 pointer-events-none">
                          <div className="h-9 sm:h-10" />
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
            )
            }

            {/* Spinner Infinite Scroll */}
            {hayMasProductos && !cargandoMas && !cargando && (
              <div ref={observerTarget} className="h-20 flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <CartLoader size="small" />
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

                </div>
        </div>
      </div>
      <CarritoFlotante />
    </div>
  );
}