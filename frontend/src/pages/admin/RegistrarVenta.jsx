import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { obtenerProductos } from "../../lib/productos";
import { obtenerCategorias } from "../../lib/categorias";
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
    IoClose
} from "react-icons/io5";

export default function RegistrarVenta() {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [carrito, setCarrito] = useState([]);
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
    const costoEnvio = tipoEntrega === "domicilio" ? 2000 : 0;
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
            // 1. Verificar stock nuevamente
            for (const item of carrito) {
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
                productos: carrito.map(p => ({
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
            for (const item of carrito) {
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
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 pb-24 lg:pb-8">

            {/* SECCIÓN IZQUIERDA: CATÁLOGO */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Header y Filtros */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <IoGrid className="text-indigo-600" />
                                Nueva Venta
                            </h1>
                            <p className="text-slate-500 text-sm">Selecciona productos para agregar a la orden</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <select
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grid de Productos */}
                <div className="flex-1 overflow-y-auto min-h-[500px]">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                            {productosFiltrados.map(producto => (
                                <button
                                    key={producto.id}
                                    onClick={() => agregarProducto(producto)}
                                    disabled={producto.stock <= 0}
                                    className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left group flex flex-col h-full ${producto.stock <= 0 ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-1"
                                        }`}
                                >
                                    <div className="aspect-square bg-slate-100 rounded-lg mb-3 overflow-hidden relative">
                                        {producto.imagen_url ? (
                                            <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <IoCartOutline size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-slate-800 line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                                        {producto.nombre}
                                    </h3>
                                    <div className="mt-auto flex justify-between items-end">
                                        <p className="font-bold text-lg text-slate-900">
                                            ${parseInt(producto.precio).toLocaleString("es-CO")}
                                        </p>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${producto.stock <= 0
                                                ? "bg-rose-100 text-rose-600"
                                                : producto.stock <= 5
                                                    ? "bg-orange-100 text-orange-600"
                                                    : "bg-slate-100 text-slate-600"
                                            }`}>
                                            {producto.stock <= 0 ? "AGOTADO" : `${producto.stock} und`}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* BARRA INFERIOR MÓVIL (STICKY) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 lg:hidden z-40 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div>
                    <p className="text-sm text-slate-500">Total a cobrar</p>
                    <p className="text-2xl font-black text-slate-900">${totalFinal.toLocaleString("es-CO")}</p>
                </div>
                <button
                    onClick={() => setMostrarCarrito(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
                >
                    <IoCartOutline size={24} />
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{carrito.reduce((acc, i) => acc + i.cantidad, 0)}</span>
                    Ver Pedido
                </button>
            </div>

            {/* SECCIÓN DERECHA: RESUMEN DE VENTA (MODAL EN MÓVIL / COLUMNA EN DESKTOP) */}
            <div className={`
                fixed inset-0 z-50 bg-slate-50/50 backdrop-blur-sm lg:static lg:bg-transparent lg:z-auto lg:w-[400px] lg:block
                ${mostrarCarrito ? "block" : "hidden"}
            `}>
                <div className="absolute inset-0 lg:static flex flex-col h-full lg:h-[calc(100vh-6rem)] lg:sticky lg:top-6">
                    {/* Overlay click para cerrar en móvil */}
                    <div className="absolute inset-0 bg-black/20 lg:hidden" onClick={() => setMostrarCarrito(false)} />

                    <div className="relative bg-white lg:rounded-2xl shadow-2xl lg:shadow-lg border-l lg:border border-slate-100 flex flex-col h-full w-full max-w-md ml-auto lg:max-w-none animate-in slide-in-from-right duration-300 lg:animate-none">

                        {/* Header del Carrito */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 lg:rounded-t-2xl flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <IoCashOutline className="text-emerald-600" />
                                    Resumen de Venta
                                </h2>
                                <button onClick={() => setMostrarCarrito(false)} className="lg:hidden p-2 bg-slate-100 rounded-full text-slate-500">
                                    <IoCheckmarkCircle className="text-xl" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {/* Cliente */}
                                <div className="relative">
                                    <IoPersonOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Nombre del Cliente (Opcional)"
                                        value={clienteNombre}
                                        onChange={(e) => setClienteNombre(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                {/* Tipo de Entrega */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setTipoEntrega("recoger")}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${tipoEntrega === "recoger"
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        En Tienda
                                    </button>
                                    <button
                                        onClick={() => setTipoEntrega("domicilio")}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${tipoEntrega === "domicilio"
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        Domicilio (+$2k)
                                    </button>
                                </div>

                                {/* Dirección si es domicilio */}
                                {tipoEntrega === "domicilio" && (
                                    <div className="relative animate-in slide-in-from-top duration-200">
                                        <IoLocationOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Dirección de entrega"
                                            value={direccion}
                                            onChange={(e) => setDireccion(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                )}

                                {/* Método de Pago */}
                                <select
                                    value={metodoPago}
                                    onChange={(e) => setMetodoPago(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="nequi">Nequi</option>
                                    <option value="daviplata">Daviplata</option>
                                    <option value="tarjeta">Tarjeta</option>
                                </select>

                                {/* Paga con... si es efectivo */}
                                {metodoPago === "efectivo" && (
                                    <div className="relative animate-in slide-in-from-top duration-200">
                                        <IoWalletOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            placeholder="¿Con cuánto paga?"
                                            value={pagaCon}
                                            onChange={(e) => setPagaCon(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        {pagaCon && Number(pagaCon) >= totalFinal && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">
                                                Cambio: ${cambio.toLocaleString("es-CO")}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lista de Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {carrito.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-60">
                                    <IoCartOutline size={48} />
                                    <p className="font-medium">El carrito está vacío</p>
                                </div>
                            ) : (
                                carrito.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                            {item.imagen_url ? (
                                                <img src={item.imagen_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <IoCartOutline className="text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 text-sm truncate">{item.nombre}</p>
                                            <p className="text-indigo-600 font-bold text-sm">
                                                ${(item.precio * item.cantidad).toLocaleString("es-CO")}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                                            <button
                                                onClick={() => actualizarCantidad(item.id, -1)}
                                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded transition-colors"
                                            >
                                                <IoRemove size={14} />
                                            </button>
                                            <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                                            <button
                                                onClick={() => actualizarCantidad(item.id, 1)}
                                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded transition-colors"
                                            >
                                                <IoAdd size={14} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => eliminarProducto(item.id)}
                                            className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <IoTrashBin size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Totales */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 lg:rounded-b-2xl space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-slate-600 text-sm">
                                    <span>Subtotal</span>
                                    <span>${total.toLocaleString("es-CO")}</span>
                                </div>
                                {tipoEntrega === "domicilio" && (
                                    <div className="flex justify-between items-center text-slate-600 text-sm">
                                        <span>Domicilio</span>
                                        <span>${costoEnvio.toLocaleString("es-CO")}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-2xl font-black text-slate-900 pt-2 border-t border-slate-200">
                                <span>Total</span>
                                <span>${totalFinal.toLocaleString("es-CO")}</span>
                            </div>

                            <button
                                onClick={abrirConfirmacion}
                                disabled={carrito.length === 0 || procesando}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${carrito.length === 0 || procesando
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
                                    }`}
                            >
                                {procesando ? "Procesando..." : (
                                    <>
                                        <IoCheckmarkCircle size={24} />
                                        Confirmar Venta
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN */}
            {modalConfirmacion && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <IoCheckmarkCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">¿Confirmar Venta?</h3>
                            <p className="text-slate-500 mb-6">
                                Se registrará la venta por <strong>${totalFinal.toLocaleString("es-CO")}</strong>
                                {tipoEntrega === "domicilio" && " con envío a domicilio"}
                                .
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setModalConfirmacion(false)}
                                    className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={procesarVenta}
                                    className="py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
