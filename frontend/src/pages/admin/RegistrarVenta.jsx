import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { obtenerProductos } from "../../lib/productos";
import { obtenerCategorias } from "../../lib/categorias";
import { obtenerConfiguracion, guardarConfiguracion } from "../../lib/config";
import toast from "react-hot-toast";
import {
    IoSearch,
    IoCartOutline,
    IoAdd,
    IoRemove,
    IoTrashBin,
    IoCheckmarkCircle,
    IoCashOutline,
    IoPersonOutline,
    IoGrid,
    IoLocationOutline,
    IoWalletOutline,
    IoClose,
    IoSettingsOutline,
    IoSaveOutline
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

    const [mostrarCarrito, setMostrarCarrito] = useState(false);
    const [modalConfirmacion, setModalConfirmacion] = useState(false);

    // Configuración de Envío
    const [costoEnvioConfig, setCostoEnvioConfig] = useState(2000);
    const [minimoGratisConfig, setMinimoGratisConfig] = useState(0);
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
            if (valEnvio !== null) setCostoEnvioConfig(Number(valEnvio));
            if (valMinimo !== null) setMinimoGratisConfig(Number(valMinimo));
        }
        cargarConfig();
    }, []);



    const guardarConfig = async () => {
        setLoadingConfig(true);
        const [okEnvio, okMinimo] = await Promise.all([
            guardarConfiguracion("costo_envio", costoEnvioConfig),
            guardarConfiguracion("envio_gratis_minimo", minimoGratisConfig)
        ]);

        if (okEnvio && okMinimo) {
            toast.success("Configuración actualizada correctamente");
            setConfigOpen(false);
        } else {
            toast.error("Error al actualizar algunos valores");
        }
        setLoadingConfig(false);
    };

    const reiniciarCarritoAdmin = () => {
        setCarrito([]);
        try {
            localStorage.removeItem("carrito_admin");
        } catch (e) {
            console.error("Error limpiando localStorage carrito_admin", e);
        }
        toast.success("Carrito reiniciado");
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
            toast.error("Producto sin stock");
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

    const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    // Cálculo de Envío con lógica de umbral
    const costoEnvio = useMemo(() => {
        if (tipoEntrega !== "domicilio") return 0;

        const configCosto = Number(costoEnvioConfig);
        const minimo = Number(minimoGratisConfig);

        if (minimo > 0 && total >= minimo) return 0;
        return configCosto;
    }, [tipoEntrega, total, costoEnvioConfig, minimoGratisConfig]);
    const totalFinal = total + costoEnvio;
    const cambio = (pagaCon && metodoPago === "efectivo") ? (Number(pagaCon) - totalFinal) : 0;

    const abrirConfirmacion = () => {
        if (carrito.length === 0) return;
        if (tipoEntrega === "domicilio" && !direccion.trim()) {
            toast.error("Debes ingresar la dirección para domicilio");
            return;
        }
        if (metodoPago === "efectivo" && pagaCon && Number(pagaCon) < totalFinal) {
            toast.error("El monto de pago es menor al total");
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
                throw new Error("Carrito vacío o corrupto. Reinícialo antes de continuar.");
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

            // 2. Crear pedido con TODOS los campos requeridos
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
            setMostrarCarrito(false);
            cargarDatos(); // Recargar stock

        } catch (error) {
            console.error("Error procesando venta:", error);
            toast.error(error.message || "Error al procesar la venta");
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className="bg-slate-50/50 flex flex-col lg:flex-row absolute inset-0 top-16 lg:top-20 overflow-hidden">
            {/* ==============================================
                SECCIÓN IZQUIERDA: CATÁLOGO DE PRODUCTOS 
               ============================================== */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0">

                {/* HEADER Y FILTROS */}
                <header className="bg-white px-4 py-4 md:px-6 md:py-5 border-b border-slate-200 shadow-sm z-10 shrink-0">
                    <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full">
                        {/* Título y Configuración */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                        <IoGrid size={20} />
                                    </div>
                                    Nueva Venta
                                </h1>
                            </div>
                            <button
                                onClick={() => setConfigOpen(true)}
                                className="p-2 md:px-4 md:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                                title="Configuración de Envío"
                            >
                                <IoSettingsOutline size={20} />
                                <span className="hidden md:inline">Configuración</span>
                            </button>
                        </div>

                        {/* Barra de Búsqueda y Filtros */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-100 border-transparent focus:bg-white border focus:border-indigo-500 rounded-xl focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400"
                                />
                                {busqueda && (
                                    <button
                                        onClick={() => setBusqueda("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 bg-slate-200/50 rounded-full"
                                    >
                                        <IoClose size={14} />
                                    </button>
                                )}
                            </div>
                            <select
                                value={filtroCategoria}
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                className="w-1/3 md:w-48 pl-3 pr-8 py-2.5 bg-slate-100 border-transparent focus:bg-white border focus:border-indigo-500 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-700 font-medium cursor-pointer text-sm md:text-base truncate"
                            >
                                <option value="">Todas</option>
                                {categorias.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                {/* GRID DE PRODUCTOS */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 h-64 animate-pulse flex flex-col">
                                        <div className="bg-slate-200 rounded-lg w-full aspect-square mb-3"></div>
                                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-slate-200 rounded w-1/2 mt-auto"></div>
                                    </div>
                                ))}
                            </div>
                        ) : productosFiltrados.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 md:h-96 text-center px-4">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                    <IoSearch size={40} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700">No se encontraron productos</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mt-1">
                                    Intenta con otra búsqueda o cambia la categoría.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-24 lg:pb-0">
                                {productosFiltrados.map(producto => {
                                    const sinStock = producto.stock <= 0;
                                    const pocoStock = producto.stock > 0 && producto.stock <= 5;

                                    return (
                                        <div
                                            key={producto.id}
                                            onClick={() => {
                                                if (!sinStock) agregarProducto(producto);
                                            }}
                                            className={`
                                                relative bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 
                                                flex flex-col text-left group overflow-hidden cursor-pointer
                                                ${sinStock ? "opacity-60 cursor-not-allowed grayscale" : "active:scale-[0.98]"}
                                            `}
                                        >
                                            {/* Badge de Stock */}
                                            <div className="absolute top-2 right-2 z-10 flex gap-1">
                                                {pocoStock && (
                                                    <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-orange-200">
                                                        Quedan {producto.stock}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Imagen */}
                                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                                {producto.imagen_url ? (
                                                    <img
                                                        src={producto.imagen_url}
                                                        alt={producto.nombre}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <IoCartOutline size={32} />
                                                    </div>
                                                )}
                                                {sinStock && (
                                                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
                                                        <span className="bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full">AGOTADO</span>
                                                    </div>
                                                )}
                                                {/* Overlay hover */}
                                                {!sinStock && (
                                                    <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors duration-200" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="p-3 flex flex-col flex-1 gap-1">
                                                <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 md:line-clamp-2" title={producto.nombre}>
                                                    {producto.nombre}
                                                </h3>
                                                <div className="mt-auto pt-2 flex items-center justify-between">
                                                    <span className="text-base md:text-lg font-bold text-slate-900">
                                                        ${parseInt(producto.precio).toLocaleString("es-CO")}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-semibold ${pocoStock ? "text-orange-600" : "text-slate-500"}`}>
                                                            {producto.stock} und.
                                                        </span>
                                                        {!sinStock && (
                                                            (() => {
                                                                const enCarrito = carrito.find(item => item.id === producto.id);
                                                                return enCarrito ? (
                                                                    <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md text-lg lg:text-sm animate-in zoom-in-50 duration-200">
                                                                        {enCarrito.cantidad}
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-slate-50 text-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                        <IoAdd size={24} className="lg:w-5 lg:h-5" />
                                                                    </div>
                                                                );
                                                            })()
                                                        )}
                                                    </div>
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
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40 flex items-center gap-3">
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total</p>
                        <p className="text-2xl font-black text-slate-900 leading-none">
                            ${totalFinal.toLocaleString("es-CO")}
                        </p>
                    </div>
                    <button
                        onClick={() => setMostrarCarrito(true)}
                        className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2.5 shadow-lg active:scale-95 transition-all text-sm"
                    >
                        <div className="relative">
                            <IoCartOutline size={22} />
                            {carrito.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                                    {carrito.reduce((acc, i) => acc + i.cantidad, 0)}
                                </span>
                            )}
                        </div>
                        <span>Ver Carrito</span>
                    </button>
                </div>
            </div >

            {/* ==============================================
                SECCIÓN DERECHA: CARRITO Y CHECKOUT 
               ============================================== */}
            < div className={`
                fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm lg:static lg:bg-white lg:z-auto lg:w-[420px] lg:border-l lg:border-slate-200 transition-all duration-300
                ${mostrarCarrito ? "opacity-100 visible" : "opacity-0 invisible lg:opacity-100 lg:visible"}
            `}>
                <div className={`
                    absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl lg:shadow-none flex flex-col h-full transform transition-transform duration-300 ease-out
                    ${mostrarCarrito ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
                `}>

                    {/* Header Carrito */}
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                <IoCartOutline size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Resumen del Pedido
                            </h2>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
                                {carrito.length} items
                            </span>
                        </div>
                        <button
                            onClick={() => setMostrarCarrito(false)}
                            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <IoClose size={24} />
                        </button>
                    </div>

                    {/* Lista de Items Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {carrito.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                    <IoCartOutline size={48} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700">Tu carrito está vacío</h3>
                                <p className="text-slate-500 text-sm mt-2">Agrega productos del catálogo para comenzar una venta.</p>
                            </div>
                        ) : (
                            carrito.map(item => (
                                <div key={item.id} className="group bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex gap-3 hover:border-indigo-200 transition-colors">
                                    {/* Imagen Item */}
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                                        {item.imagen_url ? (
                                            <img src={item.imagen_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <IoCartOutline size={20} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Item */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-tight">
                                                {item.nombre}
                                            </h4>
                                            <p className="font-bold text-indigo-600 text-sm whitespace-nowrap">
                                                ${(item.precio * item.cantidad).toLocaleString("es-CO")}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="text-xs text-slate-500 font-medium">
                                                ${parseInt(item.precio).toLocaleString("es-CO")} c/u
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Control Cantidad */}
                                                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                                    <button
                                                        onClick={() => actualizarCantidad(item.id, -1)}
                                                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm rounded-md transition-all active:scale-95"
                                                    >
                                                        <IoRemove size={14} />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-bold text-slate-700 font-mono">
                                                        {item.cantidad}
                                                    </span>
                                                    <button
                                                        onClick={() => actualizarCantidad(item.id, 1)}
                                                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm rounded-md transition-all active:scale-95"
                                                    >
                                                        <IoAdd size={14} />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => eliminarProducto(item.id)}
                                                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                                    title="Eliminar producto"
                                                >
                                                    <IoTrashBin size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Formulario y Checkout (Sticky Bottom en Panel) */}
                    <div className="bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0 z-10">
                        {/* Selector Entrega & Cliente en Accordion o Compacto */}
                        <div className="p-5 pb-0 space-y-4">

                            {/* Tabs Tipo Entrega */}
                            <div className="flex p-1 bg-slate-100 rounded-xl">
                                <button
                                    onClick={() => setTipoEntrega("recoger")}
                                    className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2
                                        ${tipoEntrega === "recoger" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    <IoGrid size={16} /> En Tienda
                                </button>
                                <button
                                    onClick={() => setTipoEntrega("domicilio")}
                                    className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2
                                        ${tipoEntrega === "domicilio" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    <IoLocationOutline size={16} /> Domicilio
                                </button>
                            </div>

                            {/* Info Cliente (Grid Compacto) */}
                            <div className="grid grid-cols-1 gap-3">
                                <input
                                    type="text"
                                    placeholder="Nombre Cliente (Opcional)"
                                    value={clienteNombre}
                                    onChange={(e) => setClienteNombre(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                />

                                {tipoEntrega === "domicilio" && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2">
                                        <input
                                            type="text"
                                            placeholder="Dirección completa..."
                                            value={direccion}
                                            onChange={(e) => setDireccion(e.target.value)}
                                            className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all
                                                ${!direccion && tipoEntrega === "domicilio" ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}
                                        />
                                        {minimoGratisConfig > 0 && (
                                            <div className="text-xs text-center text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                                                Envío gratis por compras &gt; <span className="font-bold text-slate-700">${minimoGratisConfig.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Método Pago y Cambio */}
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={metodoPago}
                                    onChange={(e) => setMetodoPago(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="nequi">Nequi</option>
                                    <option value="daviplata">Daviplata</option>
                                    <option value="tarjeta">Tarjeta</option>
                                </select>

                                {metodoPago === "efectivo" ? (
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                        <input
                                            type="number"
                                            placeholder="Paga con..."
                                            value={pagaCon}
                                            onChange={(e) => setPagaCon(e.target.value)}
                                            className={`w-full pl-6 pr-2 py-2 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none
                                                ${pagaCon && Number(pagaCon) < totalFinal ? "border-rose-300 text-rose-600 bg-rose-50" : "border-slate-200"}`}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200 italic">
                                        Sin cambio
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Totales y Botón Acción */}
                        <div className="p-5 bg-slate-50/50 mt-4 space-y-3">
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span>${total.toLocaleString("es-CO")}</span>
                                </div>
                                {tipoEntrega === "domicilio" && (
                                    <div className="flex justify-between text-slate-500">
                                        <span>Domicilio</span>
                                        <span className={costoEnvio === 0 ? "text-emerald-600 font-bold" : ""}>
                                            {costoEnvio === 0 ? "GRATIS" : `$${costoEnvio.toLocaleString("es-CO")}`}
                                        </span>
                                    </div>
                                )}
                                {metodoPago === "efectivo" && pagaCon && Number(pagaCon) >= totalFinal && (
                                    <div className="flex justify-between text-emerald-600 font-bold pt-1">
                                        <span>Cambio</span>
                                        <span>${cambio.toLocaleString("es-CO")}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-end pt-2 border-t border-slate-200">
                                <span className="text-slate-600 font-medium pb-1">Total a Pagar</span>
                                <span className="text-3xl font-black text-slate-900 leading-none">
                                    ${totalFinal.toLocaleString("es-CO")}
                                </span>
                            </div>

                            <button
                                onClick={abrirConfirmacion}
                                disabled={carrito.length === 0 || procesando}
                                className={`w-full py-3.5 rounded-xl font-bold text-base md:text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]
                                    ${carrito.length === 0 || procesando
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30"
                                    }`}
                            >
                                {procesando ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        Confirmar Venta <IoCheckmarkCircle size={22} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div >

            {/* MODAL CONFIRMACIÓN (REUTILIZADO CON ESTILO MEJORADO) */}
            {
                modalConfirmacion && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                    <IoCheckmarkCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">¿Todo listo?</h3>
                                <p className="text-slate-500 mb-6 text-sm">
                                    Se registrará una venta por <strong className="text-slate-800 text-base">${totalFinal.toLocaleString("es-CO")}</strong>
                                    <br />
                                    {tipoEntrega === "domicilio" ? " con entrega a domicilio." : " con entrega inmediata."}
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setModalConfirmacion(false)}
                                        className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                                    >
                                        Volver
                                    </button>
                                    <button
                                        onClick={procesarVenta}
                                        className="py-3 px-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30"
                                    >
                                        ¡Sí, Confirmar!
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MODAL CONFIGURACIÓN (MANTENIDO IGUAL PERO CON Z-INDEX AJUSTADO) */}
            {
                configOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <IoSettingsOutline className="text-indigo-600" />
                                    Configuración Domicilio
                                </h3>
                                <button onClick={() => setConfigOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <IoClose size={24} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Costo de Envío Base</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                        <input
                                            type="number"
                                            value={costoEnvioConfig}
                                            onChange={(e) => setCostoEnvioConfig(e.target.value)}
                                            className="w-full pl-7 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Envío Gratis Desde</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                        <input
                                            type="number"
                                            value={minimoGratisConfig}
                                            onChange={(e) => setMinimoGratisConfig(e.target.value)}
                                            className="w-full pl-7 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5">Monto mínimo para que el envío sea automático $0.</p>
                                </div>
                                <div className="pt-2 flex gap-3">
                                    <button
                                        onClick={() => setConfigOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={guardarConfig}
                                        disabled={loadingConfig}
                                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                    >
                                        {loadingConfig ? "Guardando..." : "Guardar"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
