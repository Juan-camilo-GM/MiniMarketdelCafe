import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { obtenerProductos } from "../../lib/productos";
import { obtenerCategorias } from "../../lib/categorias";
import { obtenerConfiguracion, guardarConfiguracion, subscribeConfiguracion } from "../../lib/config";
import toast from "react-hot-toast";
import {
    IoSearch,
    IoCartOutline,
    IoCart,
    IoAdd,
    IoRemove,
    IoTrashOutline,
    IoCheckmarkCircle,
    IoGrid,
    IoLocationOutline,
    IoStorefrontOutline,
    IoClose,
    IoSettingsOutline,
    IoChevronDown,
    IoChevronUp,
    IoChevronForward,
    IoChevronBack,
    IoExpandOutline,
    IoContractOutline,
    IoReceiptOutline,
    IoCashOutline,
    IoCardOutline,
    IoPhonePortraitOutline,
    IoPersonOutline
} from "react-icons/io5";

export default function RegistrarVenta() {
    // Normaliza y valida objetos del carrito guardados en localStorage
    const sanitizeCarritoItems = (items) => {
        if (!Array.isArray(items)) return [];
        return items.map(it => {
            const id = Number(it?.id) || null;
            const cantidad = Number(it?.cantidad) || 0;
            const precio = Number(it?.precio) || 0;
            const nombre = it?.nombre || "Producto";
            const imagen_url = it?.imagen_url || null;
            const stock = Number(it?.stock) || 0;
            return { id, cantidad, precio, nombre, imagen_url, stock };
        }).filter(i => i.id && i.cantidad > 0 && !isNaN(i.precio));
    };

    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [carrito, setCarrito] = useState(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("carrito_admin");
                const parsed = saved ? JSON.parse(saved) : [];
                return sanitizeCarritoItems(parsed);
            } catch (e) {
                console.error("Error cargando carrito admin", e);
                return [];
            }
        }
        return [];
    });

    // Guardar carrito en localStorage cuando cambie
    useEffect(() => {
        localStorage.setItem("carrito_admin", JSON.stringify(carrito));
    }, [carrito]);

    const [busqueda, setBusqueda] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("");
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState(false);

    // Estados del formulario de venta
    const [clienteNombre, setClienteNombre] = useState("");
    const [metodoPago, setMetodoPago] = useState("efectivo");
    const [tipoEntrega, setTipoEntrega] = useState("recoger"); // recoger | domicilio
    const [direccion, setDireccion] = useState("");
    const [pagaCon, setPagaCon] = useState("");

    // Estados de interfaz y visualización
    const [mostrarCarritoMobile, setMostrarCarritoMobile] = useState(false);
    const [sidebarDesktopAbierto, setSidebarDesktopAbierto] = useState(true);
    const [modoAnchoDesktop, setModoAnchoDesktop] = useState(false);
    const [detallesCobroAbierto, setDetallesCobroAbierto] = useState(true);
    const [modalConfirmacion, setModalConfirmacion] = useState(false);
    const [modalVaciarCarrito, setModalVaciarCarrito] = useState(false);

    // Configuración de Envío
    const [costoEnvioConfig, setCostoEnvioConfig] = useState(2000);
    const [minimoGratisConfig, setMinimoGratisConfig] = useState(0);
    const [costoEnvioReducidoConfig, setCostoEnvioReducidoConfig] = useState(0);
    const [configOpen, setConfigOpen] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [prods, cats] = await Promise.all([
                obtenerProductos(),
                obtenerCategorias()
            ]);
            setProductos(prods);
            setCategorias(cats);
        } catch (error) {
            console.error("Error cargando datos:", error);
            toast.error("Error al cargar productos");
        } finally {
            setLoading(false);
        }
    };

    // Cargar configuración de envío
    useEffect(() => {
        async function cargarConfig() {
            const valEnvio = await obtenerConfiguracion("costo_envio");
            const valMinimo = await obtenerConfiguracion("envio_gratis_minimo");
            const valReducido = await obtenerConfiguracion("costo_envio_reducido");
            if (valEnvio !== null) setCostoEnvioConfig(Number(valEnvio));
            if (valMinimo !== null) setMinimoGratisConfig(Number(valMinimo));
            if (valReducido !== null) setCostoEnvioReducidoConfig(Number(valReducido));
        }
        cargarConfig();

        // Suscribirse a cambios en tiempo real
        const unsubCosto = subscribeConfiguracion("costo_envio", (v) => {
            const n = Number(v);
            if (!isNaN(n)) setCostoEnvioConfig(n);
        });
        const unsubMin = subscribeConfiguracion("envio_gratis_minimo", (v) => {
            const n = Number(v);
            if (!isNaN(n)) setMinimoGratisConfig(n);
        });
        const unsubReducido = subscribeConfiguracion("costo_envio_reducido", (v) => {
            const n = Number(v);
            if (!isNaN(n)) setCostoEnvioReducidoConfig(n);
        });

        return () => {
            if (typeof unsubCosto === "function") unsubCosto();
            if (typeof unsubMin === "function") unsubMin();
            if (typeof unsubReducido === "function") unsubReducido();
        };
    }, []);

    const guardarConfig = async () => {
        setLoadingConfig(true);
        const [okEnvio, okMinimo, okReducido] = await Promise.all([
            guardarConfiguracion("costo_envio", costoEnvioConfig),
            guardarConfiguracion("envio_gratis_minimo", minimoGratisConfig),
            guardarConfiguracion("costo_envio_reducido", costoEnvioReducidoConfig)
        ]);

        if (okEnvio && okMinimo && okReducido) {
            toast.success("Configuración actualizada correctamente");
            setConfigOpen(false);
        } else {
            toast.error("Error al actualizar algunos valores");
        }
        setLoadingConfig(false);
    };

    const productosFiltrados = useMemo(() => {
        return productos.filter(p => {
            const matchTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const matchCat = filtroCategoria === "" || p.categoria_id === Number(filtroCategoria);
            return matchTexto && matchCat;
        });
    }, [productos, busqueda, filtroCategoria]);

    const agregarProducto = (producto) => {
        if (producto.stock <= 0) {
            toast.error("Producto sin stock disponible");
            return;
        }

        setCarrito(prev => {
            const existe = prev.find(item => item.id === producto.id);
            if (existe) {
                if (existe.cantidad >= producto.stock) {
                    toast.error("No hay más stock disponible");
                    return prev;
                }
                return prev.map(item =>
                    item.id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prev, { ...producto, cantidad: 1 }];
        });
    };

    const actualizarCantidad = (id, delta) => {
        setCarrito(prev => prev.map(item => {
            if (item.id === id) {
                const nuevaCantidad = item.cantidad + delta;
                if (nuevaCantidad < 1) return item;
                if (nuevaCantidad > item.stock) {
                    toast.error("Stock insuficiente");
                    return item;
                }
                return { ...item, cantidad: nuevaCantidad };
            }
            return item;
        }));
    };

    const eliminarProducto = (id) => {
        setCarrito(prev => prev.filter(item => item.id !== id));
    };

    const vaciarCarrito = () => {
        setCarrito([]);
        setModalVaciarCarrito(false);
        toast.success("Carrito vaciado correctamente");
    };

    const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

    // Cálculo de Envío con lógica de umbral
    const costoEnvio = useMemo(() => {
        if (tipoEntrega !== "domicilio") return 0;

        const configCosto = Number(costoEnvioConfig);
        const minimo = Number(minimoGratisConfig);
        const reducido = Number(costoEnvioReducidoConfig);

        if (minimo > 0 && total >= minimo) return reducido;
        return configCosto;
    }, [tipoEntrega, total, costoEnvioConfig, minimoGratisConfig, costoEnvioReducidoConfig]);

    const totalFinal = total + costoEnvio;
    const cambio = (pagaCon && metodoPago === "efectivo") ? (Number(pagaCon) - totalFinal) : 0;

    // Sugerencias de billetes rápidos para cobro en efectivo
    const billetesSugeridos = useMemo(() => {
        if (!totalFinal || totalFinal <= 0 || metodoPago !== "efectivo") return [];
        const sugerencias = new Set();

        // Monto exacto
        sugerencias.add(totalFinal);

        // Múltiplos comunes
        const prox5k = Math.ceil(totalFinal / 5000) * 5000;
        if (prox5k > totalFinal) sugerencias.add(prox5k);

        const prox10k = Math.ceil(totalFinal / 10000) * 10000;
        if (prox10k > totalFinal) sugerencias.add(prox10k);

        const billetes = [20000, 50000, 100000];
        billetes.forEach(b => {
            if (b > totalFinal && sugerencias.size < 5) sugerencias.add(b);
        });

        return Array.from(sugerencias).sort((a, b) => a - b).slice(0, 5);
    }, [totalFinal, metodoPago]);

    const abrirConfirmacion = () => {
        if (carrito.length === 0) {
            toast.error("El carrito está vacío");
            return;
        }
        if (tipoEntrega === "domicilio" && !direccion.trim()) {
            setDetallesCobroAbierto(true);
            toast.error("Debes ingresar la dirección de entrega");
            return;
        }
        if (metodoPago === "efectivo" && pagaCon && Number(pagaCon) < totalFinal) {
            setDetallesCobroAbierto(true);
            toast.error("El monto de pago es inferior al total");
            return;
        }
        setModalConfirmacion(true);
    };

    const procesarVenta = async () => {
        setProcesando(true);
        try {
            // 0. Sanitizar carrito antes de procesar
            const sanitizedCarrito = sanitizeCarritoItems(carrito);
            if (!sanitizedCarrito || sanitizedCarrito.length === 0) {
                throw new Error("Carrito vacío o con datos inválidos.");
            }

            // 1. Verificar stock nuevamente
            for (const item of sanitizedCarrito) {
                const { data: prodActual } = await supabase
                    .from("productos")
                    .select("stock")
                    .eq("id", item.id)
                    .single();

                if (!prodActual || prodActual.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para ${item.nombre}`);
                }
            }

            // 2. Crear pedido con todos los campos requeridos
            const pedido = {
                cliente_nombre: clienteNombre || "Venta en Caja",
                cliente_direccion: tipoEntrega === "domicilio" ? direccion : null,
                subtotal: total,
                costo_envio: costoEnvio,
                total: totalFinal,
                estado: "confirmado",
                tipo_entrega: tipoEntrega,
                metodo_pago: metodoPago,
                cambio: (metodoPago === "efectivo" && pagaCon) ? Number(pagaCon) - totalFinal : null,
                productos: sanitizedCarrito.map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    precio: p.precio,
                    cantidad: p.cantidad
                })),
                created_at: new Date().toISOString()
            };

            const { error: errorPedido } = await supabase
                .from("pedidos")
                .insert(pedido);

            if (errorPedido) throw errorPedido;

            // 3. Actualizar stock
            for (const item of sanitizedCarrito) {
                const { data: prod } = await supabase
                    .from("productos")
                    .select("stock")
                    .eq("id", item.id)
                    .single();

                await supabase
                    .from("productos")
                    .update({ stock: prod.stock - item.cantidad })
                    .eq("id", item.id);
            }

            toast.success("Venta registrada correctamente");
            setCarrito([]);
            setClienteNombre("");
            setMetodoPago("efectivo");
            setTipoEntrega("recoger");
            setDireccion("");
            setPagaCon("");
            setModalConfirmacion(false);
            setMostrarCarritoMobile(false);
            cargarDatos(); // Recargar stock

        } catch (error) {
            console.error("Error procesando venta:", error);
            toast.error(error.message || "Error al procesar la venta");
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className="bg-slate-100 flex flex-col lg:flex-row absolute inset-0 top-16 lg:top-20 overflow-hidden select-none">
            
            {/* =========================================================================
                SECCIÓN IZQUIERDA: CATÁLOGO DE PRODUCTOS (ADAPTABLE)
               ========================================================================= */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0">

                {/* HEADER Y FILTROS */}
                <header className="bg-white px-4 py-3.5 md:px-6 md:py-4 border-b border-slate-200 shadow-sm z-10 shrink-0">
                    <div className="flex flex-col gap-3 max-w-7xl mx-auto w-full">
                        
                        {/* Fila 1: Título, Configuración y Toggle de Carrito Desktop */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
                                    <IoGrid size={20} />
                                </div>
                                <div>
                                    <h1 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight">
                                        Punto de Venta
                                    </h1>
                                    <p className="text-xs text-slate-500 hidden sm:block">
                                        {productosFiltrados.length} productos disponibles
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Botón Configuración de Envío */}
                                <button
                                    onClick={() => setConfigOpen(true)}
                                    className="p-2 md:px-3.5 md:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all flex items-center gap-2 text-sm active:scale-95 cursor-pointer"
                                    title="Configuración de Domicilio"
                                >
                                    <IoSettingsOutline size={18} className="text-indigo-600" />
                                    <span className="hidden md:inline">Tarifas Domicilio</span>
                                </button>

                                {/* Botón para abrir/cerrar carrito en PC si está colapsado */}
                                <button
                                    onClick={() => setSidebarDesktopAbierto(prev => !prev)}
                                    className={`hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                                        sidebarDesktopAbierto
                                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                                    }`}
                                    title={sidebarDesktopAbierto ? "Ocultar panel del carrito" : "Mostrar panel del carrito"}
                                >
                                    <IoCartOutline size={18} />
                                    <span>{sidebarDesktopAbierto ? "Ocultar Resumen" : `Ver Carrito (${totalItems})`}</span>
                                </button>
                            </div>
                        </div>

                        {/* Fila 2: Buscador y Categorías */}
                        <div className="flex gap-2.5">
                            <div className="relative flex-1">
                                <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre de producto..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2 bg-slate-100 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-800 text-sm placeholder:text-slate-400"
                                />
                                {busqueda && (
                                    <button
                                        onClick={() => setBusqueda("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 bg-slate-200/60 rounded-full cursor-pointer"
                                    >
                                        <IoClose size={14} />
                                    </button>
                                )}
                            </div>

                            <select
                                value={filtroCategoria}
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                className="w-2/5 sm:w-48 px-3 py-2 bg-slate-100 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-700 font-semibold cursor-pointer text-xs sm:text-sm truncate"
                            >
                                <option value="">Todas las Categorías</option>
                                {categorias.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                {/* GRID DE PRODUCTOS */}
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-slate-100/70 scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        {loading ? (
                            <div className={`grid gap-3 sm:gap-4 ${
                                sidebarDesktopAbierto
                                    ? modoAnchoDesktop
                                        ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
                                        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                            }`}>
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/60 h-64 animate-pulse flex flex-col">
                                        <div className="bg-slate-200 rounded-xl w-full aspect-square mb-3"></div>
                                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-slate-200 rounded w-1/2 mt-auto"></div>
                                    </div>
                                ))}
                            </div>
                        ) : productosFiltrados.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 md:h-96 text-center px-4">
                                <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-4 text-slate-300">
                                    <IoSearch size={40} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">No se encontraron productos</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mt-1 text-sm">
                                    Prueba con otra palabra clave o selecciona otra categoría.
                                </p>
                            </div>
                        ) : (
                            <div className={`grid gap-3 sm:gap-4 pb-28 lg:pb-6 ${
                                sidebarDesktopAbierto
                                    ? modoAnchoDesktop
                                        ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
                                        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                            }`}>
                                {productosFiltrados.map(producto => {
                                    const sinStock = producto.stock <= 0;
                                    const pocoStock = producto.stock > 0 && producto.stock <= 5;
                                    const enCarrito = carrito.find(item => item.id === producto.id);

                                    return (
                                        <div
                                            key={producto.id}
                                            onClick={() => {
                                                if (!sinStock) agregarProducto(producto);
                                            }}
                                            className={`
                                                relative bg-white rounded-2xl shadow-sm border border-slate-200/80 hover:shadow-md hover:border-indigo-300 transition-all duration-200 
                                                flex flex-col text-left group overflow-hidden cursor-pointer
                                                ${sinStock ? "opacity-60 cursor-not-allowed grayscale" : "active:scale-[0.98]"}
                                            `}
                                        >
                                            {/* Badge de Stock */}
                                            <div className="absolute top-2.5 right-2.5 z-10 flex gap-1">
                                                {pocoStock && (
                                                    <span className="bg-amber-100/90 backdrop-blur-sm text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-amber-200">
                                                        Quedan {producto.stock}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Imagen */}
                                            <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                                                {producto.imagen_url ? (
                                                    <img
                                                        src={producto.imagen_url}
                                                        alt={producto.nombre}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <IoCartOutline size={32} />
                                                    </div>
                                                )}
                                                {sinStock && (
                                                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
                                                        <span className="bg-white text-slate-900 text-xs font-black px-3 py-1 rounded-full shadow">AGOTADO</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="p-3 sm:p-3.5 flex flex-col flex-1 gap-1">
                                                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm leading-snug line-clamp-2" title={producto.nombre}>
                                                    {producto.nombre}
                                                </h3>
                                                
                                                <div className="mt-auto pt-2 flex items-center justify-between gap-1">
                                                    <div>
                                                        <span className="text-sm sm:text-base font-extrabold text-slate-900 block leading-tight">
                                                            ${parseInt(producto.precio).toLocaleString("es-CO")}
                                                        </span>
                                                        <span className={`text-[11px] font-semibold ${pocoStock ? "text-amber-600" : "text-slate-400"}`}>
                                                            Stock: {producto.stock}
                                                        </span>
                                                    </div>

                                                    {!sinStock && (
                                                        enCarrito ? (
                                                            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20">
                                                                {enCarrito.cantidad}
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                                                                <IoAdd size={18} />
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>

                {/* BARRA INFERIOR FLOTANTE (SOLO MOBILE) */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 px-4 shadow-[0_-8px_25px_rgba(0,0,0,0.12)] z-40 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                            <span>Total ({totalItems} items)</span>
                            {tipoEntrega === "domicilio" && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                                    Domicilio
                                </span>
                            )}
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight truncate">
                            ${totalFinal.toLocaleString("es-CO")}
                        </p>
                    </div>

                    <button
                        onClick={() => setMostrarCarritoMobile(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2.5 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all text-sm shrink-0 cursor-pointer"
                    >
                        <div className="relative">
                            <IoCartOutline size={22} />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-indigo-600">
                                    {totalItems}
                                </span>
                            )}
                        </div>
                        <span>Ver Pedido</span>
                    </button>
                </div>

                {/* BOTÓN FLOTANTE EN DESKTOP SI EL SIDEBAR ESTÁ OCULTO */}
                {!sidebarDesktopAbierto && (
                    <button
                        onClick={() => setSidebarDesktopAbierto(true)}
                        className="hidden lg:flex fixed right-6 bottom-6 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl items-center gap-3 z-30 transition-all hover:scale-105 active:scale-95 border-2 border-white/20 cursor-pointer"
                    >
                        <div className="relative">
                            <IoCart size={24} />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-indigo-600">
                                    {totalItems}
                                </span>
                            )}
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] uppercase font-bold text-indigo-200">Resumen Carrito</p>
                            <p className="text-base font-extrabold leading-none">${totalFinal.toLocaleString("es-CO")}</p>
                        </div>
                        <IoChevronBack size={18} className="text-indigo-200" />
                    </button>
                )}
            </div>

            {/* =========================================================================
                SECCIÓN DERECHA: CARRITO Y RESUMEN DEL PEDIDO
               ========================================================================= */}
            <div className={`
                fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-all duration-300
                ${sidebarDesktopAbierto ? "lg:static lg:bg-transparent lg:z-auto lg:visible lg:opacity-100" : "lg:hidden"}
                ${sidebarDesktopAbierto && modoAnchoDesktop ? "lg:w-[580px]" : "lg:w-[440px]"}
                ${mostrarCarritoMobile ? "opacity-100 visible" : "opacity-0 invisible lg:opacity-100 lg:visible"}
            `}>
                <div className={`
                    absolute inset-y-0 right-0 w-full max-w-[600px] lg:max-w-none bg-white shadow-2xl lg:shadow-none flex flex-col h-full transform transition-transform duration-300 ease-out border-l border-slate-200
                    ${mostrarCarritoMobile ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
                `}>

                    {/* HEADER DEL RESUMEN */}
                    <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                                <IoReceiptOutline size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800 leading-tight">
                                    Resumen del Pedido
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">
                                    {totalItems} {totalItems === 1 ? "unidad" : "unidades"} ({carrito.length} productos)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Botón Vaciar Carrito */}
                            {carrito.length > 0 && (
                                <button
                                    onClick={() => setModalVaciarCarrito(true)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                    title="Vaciar carrito"
                                >
                                    <IoTrashOutline size={18} />
                                </button>
                            )}

                            {/* Toggle Ancho Amplio / Compacto (Desktop) */}
                            <button
                                onClick={() => setModoAnchoDesktop(prev => !prev)}
                                className="hidden lg:flex p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                title={modoAnchoDesktop ? "Vista compacta" : "Vista amplia del carrito"}
                            >
                                {modoAnchoDesktop ? <IoContractOutline size={18} /> : <IoExpandOutline size={18} />}
                            </button>

                            {/* Botón Minimizar Panel en PC */}
                            <button
                                onClick={() => setSidebarDesktopAbierto(false)}
                                className="hidden lg:flex p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                title="Ocultar resumen"
                            >
                                <IoChevronForward size={20} />
                            </button>

                            {/* Botón Cerrar Drawer en Móvil */}
                            <button
                                onClick={() => setMostrarCarritoMobile(false)}
                                className="lg:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <IoClose size={24} />
                            </button>
                        </div>
                    </div>

                    {/* LISTA DE PRODUCTOS CON SCROLL */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/60 scroll-smooth">
                        {carrito.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-70">
                                <div className="w-20 h-20 bg-slate-200/70 rounded-2xl flex items-center justify-center mb-3 text-slate-400">
                                    <IoCartOutline size={40} />
                                </div>
                                <h3 className="text-base font-bold text-slate-700">El carrito está vacío</h3>
                                <p className="text-slate-500 text-xs max-w-xs mt-1">
                                    Haz clic en cualquier producto del catálogo para agregarlo a la venta.
                                </p>
                            </div>
                        ) : (
                            carrito.map(item => (
                                <div
                                    key={item.id}
                                    className="group bg-white p-3.5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-sm transition-all flex gap-3.5 items-center"
                                >
                                    {/* Imagen Item */}
                                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                                        {item.imagen_url ? (
                                            <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                                        ) : (
                                            <IoCartOutline size={22} className="text-slate-300" />
                                        )}
                                    </div>

                                    {/* Info & Controles */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1 leading-snug" title={item.nombre}>
                                                    {item.nombre}
                                                </h4>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                    ${parseInt(item.precio).toLocaleString("es-CO")} c/u
                                                </p>
                                            </div>
                                            <p className="font-extrabold text-indigo-600 text-sm whitespace-nowrap">
                                                ${(item.precio * item.cantidad).toLocaleString("es-CO")}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100">
                                            {/* Indicador de stock */}
                                            <div className="text-[11px] font-medium">
                                                {item.cantidad >= item.stock ? (
                                                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold">
                                                        Máx stock ({item.stock})
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        Stock: {item.stock}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Stepper Cantidad */}
                                                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => actualizarCantidad(item.id, -1)}
                                                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-md transition-all active:scale-90 cursor-pointer"
                                                        title="Reducir cantidad"
                                                    >
                                                        <IoRemove size={14} />
                                                    </button>
                                                    <span className="w-7 text-center text-xs sm:text-sm font-bold text-slate-800 font-mono">
                                                        {item.cantidad}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => actualizarCantidad(item.id, 1)}
                                                        disabled={item.cantidad >= item.stock}
                                                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-all active:scale-90 ${
                                                            item.cantidad >= item.stock
                                                                ? "text-slate-300 cursor-not-allowed"
                                                                : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm cursor-pointer"
                                                        }`}
                                                        title="Aumentar cantidad"
                                                    >
                                                        <IoAdd size={14} />
                                                    </button>
                                                </div>

                                                {/* Eliminar Ítem */}
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarProducto(item.id)}
                                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors p-1 cursor-pointer"
                                                    title="Eliminar producto"
                                                >
                                                    <IoTrashOutline size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* SECCIÓN INFERIOR: DATOS DE COBRO DESPLEGABLES Y TOTALES */}
                    <div className="bg-white border-t border-slate-200 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] shrink-0 z-10">
                        
                        {/* BOTÓN DESPLEGABLE DE DATOS DE COBRO */}
                        <div className="p-3.5 sm:p-4 pb-0">
                            <button
                                type="button"
                                onClick={() => setDetallesCobroAbierto(prev => !prev)}
                                className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-all text-left border border-slate-200/80 active:scale-[0.99] cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm shrink-0">
                                        <IoReceiptOutline size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Datos de Entrega y Pago
                                        </p>
                                        {/* Badges de estado actual */}
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate mt-0.5">
                                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                                tipoEntrega === "domicilio" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"
                                            }`}>
                                                {tipoEntrega === "domicilio" ? (
                                                    <>
                                                        <IoLocationOutline size={12} />
                                                        <span>Domicilio</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IoStorefrontOutline size={12} />
                                                        <span>En Tienda</span>
                                                    </>
                                                )}
                                            </span>
                                            <span>•</span>
                                            <span className="capitalize font-semibold text-slate-700">{metodoPago}</span>
                                            {clienteNombre && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate text-slate-600">{clienteNombre}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 text-indigo-600 text-xs font-bold shrink-0 ml-2">
                                    <span className="hidden sm:inline">{detallesCobroAbierto ? "Ocultar" : "Modificar"}</span>
                                    {detallesCobroAbierto ? <IoChevronUp size={18} /> : <IoChevronDown size={18} />}
                                </div>
                            </button>
                        </div>

                        {/* CONTENIDO DESPLEGABLE (FORMULARIO) */}
                        {detallesCobroAbierto && (
                            <div className="p-3.5 sm:p-4 space-y-3 max-h-[320px] overflow-y-auto animate-in slide-in-from-bottom-2 duration-200">
                                
                                {/* Selector Tipo Entrega */}
                                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setTipoEntrega("recoger")}
                                        className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer
                                            ${tipoEntrega === "recoger" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        <IoStorefrontOutline size={16} /> En Tienda
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTipoEntrega("domicilio")}
                                        className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer
                                            ${tipoEntrega === "domicilio" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        <IoLocationOutline size={16} /> Domicilio
                                    </button>
                                </div>

                                {/* Nombre del Cliente */}
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <IoPersonOutline size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Nombre del cliente (opcional)"
                                        value={clienteNombre}
                                        onChange={(e) => setClienteNombre(e.target.value)}
                                        className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    />
                                    {clienteNombre && (
                                        <button
                                            type="button"
                                            onClick={() => setClienteNombre("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            <IoClose size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Campo Dirección si es Domicilio */}
                                {tipoEntrega === "domicilio" && (
                                    <div className="space-y-1.5 animate-in fade-in duration-200">
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                <IoLocationOutline size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Dirección completa de entrega..."
                                                value={direccion}
                                                onChange={(e) => setDireccion(e.target.value)}
                                                className={`w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all
                                                    ${!direccion ? "border-amber-300 bg-amber-50/50" : "border-slate-200"}`}
                                            />
                                        </div>
                                        {minimoGratisConfig > 0 && (
                                            <div className="text-[11px] text-slate-600 bg-indigo-50/60 p-2 rounded-lg border border-indigo-100 flex items-center justify-between">
                                                <span>Envío con tarifa especial por compras &gt; <strong className="text-indigo-700">${minimoGratisConfig.toLocaleString("es-CO")}</strong></span>
                                                {total >= minimoGratisConfig && (
                                                    <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">Aplicado</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Método de Pago */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                        Método de Pago
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[
                                            { id: "efectivo", label: "Efectivo", icon: <IoCashOutline /> },
                                            { id: "nequi", label: "Nequi", icon: <IoPhonePortraitOutline /> },
                                            { id: "daviplata", label: "Daviplata", icon: <IoPhonePortraitOutline /> },
                                            { id: "tarjeta", label: "Tarjeta", icon: <IoCardOutline /> }
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setMetodoPago(m.id)}
                                                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer
                                                    ${metodoPago === m.id
                                                        ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                                            >
                                                <span className="text-base">{m.icon}</span>
                                                <span className="truncate">{m.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Opciones de Efectivo (Paga con + Billetes Rápidos) */}
                                {metodoPago === "efectivo" && (
                                    <div className="space-y-2 pt-1 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                                                <input
                                                    type="number"
                                                    placeholder="¿Con cuánto paga?"
                                                    value={pagaCon}
                                                    onChange={(e) => setPagaCon(e.target.value)}
                                                    className={`w-full pl-7 pr-3 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-semibold
                                                        ${pagaCon && Number(pagaCon) < totalFinal ? "border-rose-300 text-rose-600 bg-rose-50" : "border-slate-200"}`}
                                                />
                                            </div>

                                            {pagaCon && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPagaCon("")}
                                                    className="px-2 py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded-lg cursor-pointer font-medium"
                                                >
                                                    Limpiar
                                                </button>
                                            )}
                                        </div>

                                        {/* Chips de Billetes Rápidos */}
                                        {billetesSugeridos.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Rápido:</span>
                                                {billetesSugeridos.map(monto => (
                                                    <button
                                                        key={monto}
                                                        type="button"
                                                        onClick={() => setPagaCon(monto.toString())}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer
                                                            ${Number(pagaCon) === monto
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"}`}
                                                    >
                                                        {monto === totalFinal ? "Exacto" : `$${monto.toLocaleString("es-CO")}`}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TOTALES Y BOTÓN DE CONFIRMAR VENTA */}
                        <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-200/80 space-y-3">
                            
                            {/* Desglose de Totales */}
                            <div className="space-y-1 text-xs sm:text-sm">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-slate-700">${total.toLocaleString("es-CO")}</span>
                                </div>

                                {tipoEntrega === "domicilio" && (
                                    <div className="flex justify-between text-slate-500">
                                        <span>Costo de Envío</span>
                                        <span className={`font-semibold ${costoEnvio === 0 ? "text-emerald-600 font-bold" : "text-slate-700"}`}>
                                            {costoEnvio === 0 ? "GRATIS" : `$${costoEnvio.toLocaleString("es-CO")}`}
                                        </span>
                                    </div>
                                )}

                                {metodoPago === "efectivo" && pagaCon && (
                                    Number(pagaCon) >= totalFinal ? (
                                        <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t border-slate-200/60">
                                            <span>Cambio a devolver</span>
                                            <span className="text-base">${cambio.toLocaleString("es-CO")}</span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between text-rose-500 font-bold pt-1 border-t border-slate-200/60 text-xs">
                                            <span>Falta por pagar</span>
                                            <span>${(totalFinal - Number(pagaCon)).toLocaleString("es-CO")}</span>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Total General */}
                            <div className="flex justify-between items-end pt-2 border-t border-slate-200">
                                <div>
                                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
                                        Total a Cobrar
                                    </span>
                                    <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                                        ${totalFinal.toLocaleString("es-CO")}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={abrirConfirmacion}
                                    disabled={carrito.length === 0 || procesando}
                                    className={`px-5 py-3 rounded-xl font-extrabold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer
                                        ${carrito.length === 0 || procesando
                                            ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/25 hover:shadow-indigo-500/40"
                                        }`}
                                >
                                    {procesando ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Cobrar</span>
                                            <IoCheckmarkCircle size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL: CONFIRMACIÓN DE VENTA */}
            {modalConfirmacion && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <IoCheckmarkCircle size={36} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-1">Confirmar Venta</h3>
                            
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 my-4 text-left space-y-2 text-xs sm:text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Productos:</span>
                                    <span className="font-bold text-slate-800">{totalItems} und. ({carrito.length} tipos)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Entrega:</span>
                                    <span className="font-bold text-slate-800 capitalize">
                                        {tipoEntrega === "domicilio" ? `Domicilio (${direccion})` : "En Tienda"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Pago:</span>
                                    <span className="font-bold text-slate-800 capitalize">{metodoPago}</span>
                                </div>
                                {metodoPago === "efectivo" && pagaCon && (
                                    <div className="flex justify-between text-emerald-600 font-bold">
                                        <span>Cambio:</span>
                                        <span>${cambio.toLocaleString("es-CO")}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                    <span className="font-bold text-slate-700">Total a Cobrar:</span>
                                    <span className="text-lg font-black text-slate-900">${totalFinal.toLocaleString("es-CO")}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    onClick={() => setModalConfirmacion(false)}
                                    className="py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                                >
                                    Revisar
                                </button>
                                <button
                                    onClick={procesarVenta}
                                    className="py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/25 text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    Confirmar Venta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CONFIRMAR VACIAR CARRITO */}
            {modalVaciarCarrito && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 duration-200 p-5 text-center">
                        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <IoTrashOutline size={28} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">Vaciar Carrito</h3>
                        <p className="text-xs text-slate-500 mb-5">
                            Se eliminarán todos los productos seleccionados para esta venta.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setModalVaciarCarrito(false)}
                                className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={vaciarCarrito}
                                className="py-2.5 px-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 text-xs shadow-md shadow-rose-500/25 cursor-pointer"
                            >
                                Sí, vaciar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CONFIGURACIÓN DE DOMICILIOS */}
            {configOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                            <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                                <IoSettingsOutline className="text-indigo-600" />
                                Tarifas de Domicilio
                            </h3>
                            <button onClick={() => setConfigOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <IoClose size={22} />
                            </button>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Costo de Envío Base</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                                    <input
                                        type="number"
                                        value={costoEnvioConfig}
                                        onChange={(e) => setCostoEnvioConfig(e.target.value)}
                                        className="w-full pl-7 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Monto Mínimo para Descuento</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                                    <input
                                        type="number"
                                        value={minimoGratisConfig}
                                        onChange={(e) => setMinimoGratisConfig(e.target.value)}
                                        className="w-full pl-7 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">Monto mínimo en compras para aplicar tarifa especial.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Costo de Envío con Descuento</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                                    <input
                                        type="number"
                                        value={costoEnvioReducidoConfig}
                                        onChange={(e) => setCostoEnvioReducidoConfig(e.target.value)}
                                        className="w-full pl-7 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">Si es $0, el envío será gratis al superar el mínimo.</p>
                            </div>
                            <div className="pt-2 flex gap-2.5">
                                <button
                                    onClick={() => setConfigOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarConfig}
                                    disabled={loadingConfig}
                                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 text-xs cursor-pointer"
                                >
                                    {loadingConfig ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
