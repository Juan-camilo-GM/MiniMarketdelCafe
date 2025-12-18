import { useState, useEffect, useRef } from "react";
import { IoCart, IoTrashBin, IoClose, IoCash, IoCloudUpload } from "react-icons/io5";
import { agregarPedido } from "../lib/productos";
import { obtenerConfiguracion, subscribeConfiguracion } from "../lib/config";
import toast from "react-hot-toast";

export default function CarritoFlotante({ carrito, setCarrito }) {
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [alertaStock, setAlertaStock] = useState(null);
  const [alertaCheckout, setAlertaCheckout] = useState("");

  const [cliente, setCliente] = useState({ nombre: "", direccion: "" });
  const [entrega, setEntrega] = useState("recoger");
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [costoEnvioConfig, setCostoEnvioConfig] = useState(2000); // Valor por defecto visual
  const [minimoGratisConfig, setMinimoGratisConfig] = useState(0);
  const [pago, setPago] = useState("efectivo");
  const [cambio, setCambio] = useState("");

  // TUS DATOS REALES (cambia estos valores)
  const NEQUI_NUMERO = "3154186754";
  const DAVIPLATA_NUMERO = "3154186754";
  const NOMBRE_TITULAR = "Johana González";
  const TU_NUMERO_WHATSAPP = "573218937440";

  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }, [carrito]);

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const totalFinal = total + costoEnvio;

  useEffect(() => {
    let isMounted = true;
    async function cargarConfig() {
      const valEnvio = await obtenerConfiguracion("costo_envio");
      const valMinimo = await obtenerConfiguracion("envio_gratis_minimo");
      if (!isMounted) return;
      if (valEnvio !== null) setCostoEnvioConfig(Number(valEnvio));
      if (valMinimo !== null) setMinimoGratisConfig(Number(valMinimo));
    }
    cargarConfig();

    const unsubEnvio = subscribeConfiguracion("costo_envio", (val) => {
      try {
        if (val !== null) setCostoEnvioConfig(Number(val));
      } catch (err) {
        console.error('Error al actualizar costo_envio realtime', err);
      }
    });

    const unsubMinimo = subscribeConfiguracion("envio_gratis_minimo", (val) => {
      try {
        if (val !== null) setMinimoGratisConfig(Number(val));
      } catch (err) {
        console.error('Error al actualizar envio_gratis_minimo realtime', err);
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubEnvio === 'function') unsubEnvio();
      if (typeof unsubMinimo === 'function') unsubMinimo();
    };
  }, []);

  useEffect(() => {
    let costo = 0;
    if (entrega === "domicilio") {
      costo = costoEnvioConfig;
      // Si hay umbral de envío gratis y se supera
      if (minimoGratisConfig > 0 && total >= minimoGratisConfig) {
        costo = 0;
      }
    }
    setCostoEnvio(costo);
  }, [entrega, costoEnvioConfig, minimoGratisConfig, total]);

  const toggleModal = () => setIsOpen(!isOpen);
  const abrirCheckout = () => {
    setAlertaCheckout("");
    setCheckoutOpen(true);
  };
  const cerrarCheckout = () => {
    setAlertaCheckout("");
    setCheckoutOpen(false);
    setComprobante(null);
  };

  const eliminarProducto = (id) => {
    setCarrito((prev) => prev.filter((p) => p.id !== id));
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    // Si la cantidad es 0, ofrecer eliminar o eliminar directo
    if (nuevaCantidad === 0) {
      eliminarProducto(id);
      return;
    }

    // Validar Stock
    const producto = carrito.find((p) => p.id === id);
    if (producto && nuevaCantidad > producto.stock) {
      setAlertaStock({ id, mensaje: `Solo hay ${producto.stock} disponibles` });
      setTimeout(() => setAlertaStock(null), 2000);
      return;
    }

    setCarrito((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad: nuevaCantidad } : p))
    );
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    localStorage.removeItem("carrito");
  };

  const confirmarPedido = async () => {
    if (!cliente.nombre.trim()) return setAlertaCheckout("Ingresa tu nombre");
    if (entrega === "domicilio" && !cliente.direccion.trim()) return setAlertaCheckout("Ingresa la dirección");

    // Validar carrito antes de crear el pedido
    const carritoLimpio = carrito
      .map(p => ({
        id: p?.id ?? null,
        nombre: p?.nombre ?? "",
        cantidad: Number(p?.cantidad ?? 0) || 0,
        precio: Number(p?.precio ?? 0) || 0,
      }))
      .filter(p => p.id !== null && p.nombre !== "" && p.cantidad > 0 && p.precio >= 0);

    if (carritoLimpio.length === 0) {
      setAlertaCheckout("El carrito contiene items inválidos o está vacío. Revísalo o reinícialo.");
      return;
    }

    try {
      const pedido = {
        cliente_nombre: cliente.nombre.trim(),
        cliente_direccion: entrega === "domicilio" ? cliente.direccion.trim() : null,
        productos: carritoLimpio,
        subtotal: Number(total),
        costo_envio: Number(costoEnvio),
        total: Number(totalFinal),
        estado: "pendiente",
        tipo_entrega: entrega,
        metodo_pago: pago,
        cambio: pago === "efectivo" && cambio ? Number(cambio) : null,
        created_at: new Date().toISOString(),
      };

      const guardado = await agregarPedido(pedido);
      if (!guardado) throw new Error("Error al guardar");

      let metodoPagoTexto = "";
      if (pago === "efectivo") {
        metodoPagoTexto = "Efectivo (pago al recibir)";
        if (cambio) metodoPagoTexto += `\nPago con: $${Number(cambio).toLocaleString("es-CO")} (cambio)`;
      } else if (pago === "nequi") {
        metodoPagoTexto = `Nequi al ${NEQUI_NUMERO} (${NOMBRE_TITULAR})`;
      } else if (pago === "daviplata") {
        metodoPagoTexto = `Daviplata al ${DAVIPLATA_NUMERO} (${NOMBRE_TITULAR})`;
      }

      const mensaje = `¡HOLA! Quiero hacer un pedido en *MiniMarket del Café*

    *Cliente:* ${cliente.nombre.trim()}
    ${entrega === "domicilio" ? `*Dirección:* ${cliente.direccion.trim()}\n*Entrega:* Domicilio (+$2.000)` : "*Entrega:* Recoger en tienda"}

    *Método de pago:*
    ${pago === "efectivo"
          ? cambio
            ? `Efectivo\nPago con: $${Number(cambio).toLocaleString("es-CO")} (para cambio)`
            : "Efectivo"
          : pago === "nequi"
            ? `Transferencia Nequi\nNúmero: ${NEQUI_NUMERO}\nTitular: ${NOMBRE_TITULAR}`
            : `Transferencia Daviplata\nNúmero: ${DAVIPLATA_NUMERO}\nTitular: ${NOMBRE_TITULAR}`
        }

    *Productos:*
    ${carrito.map(p => `• ${p.nombre} × ${p.cantidad} → $${(p.precio * p.cantidad).toLocaleString("es-CO")}`).join("\n")}

    *Subtotal:* $${total.toLocaleString("es-CO")}
    ${entrega === "domicilio" && costoEnvio === 0 && minimoGratisConfig > 0 ? "🎉 *¡Envío Gratis Aplicado!*\n" : ""}
    ${costoEnvio > 0 ? `*Envío:* $${costoEnvio.toLocaleString("es-CO")}\n` : ""}*TOTAL A PAGAR:* *$${totalFinal.toLocaleString("es-CO")}*

    ${pago === "efectivo"
          ? entrega === "domicilio"
            ? "¡Perfecto! El pago lo haces contra entrega. Por favor ten listo el dinero. ¡Gracias!"
            : "¡Genial! Te espero en la tienda para que pagues y recojas tu pedido. ¡Gracias!"
          : "¡Gracias! Por favor adjunta aquí el comprobante de la transferencia y confirmo tu pedido al instante"
        }`;

      // Limpiar todo
      setCarrito([]);
      localStorage.removeItem("carrito");
      setCheckoutOpen(false);
      setIsOpen(false);

      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-in fade-in slide-in-from-top" : "animate-out fade-out"
              } fixed inset-x-4 top-6 md:top-10 left-1/2 -translate-x-1/2 max-w-md w-full mx-auto z-[9999] pointer-events-auto`}
          >
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-2xl shadow-2xl p-6 flex items-center justify-between gap-5 border border-white/20">
              <div className="flex items-center gap-4">
                {/* Ícono de éxito */}
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div>
                  <p className="font-bold text-lg">Pedido Registrado</p>
                  <p className="text-sm opacity-95 mt-1">Recuerda enviar el mensaje por WhatsApp para confirmar y hacer válida la compra.</p>
                </div>
              </div>

              {/* Botón cerrar */}
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
              >
                <IoClose className="text-2xl" />
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );

      // Intentar abrir en ventana nueva; si popup bloqueado o en móvil, hacer fallback a location.href
      const whatsappUrl = `https://wa.me/${TU_NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
      const openWhatsapp = () => {
        try {
          // Crear un anchor temporal para abrir en nueva pestaña sin afectar la actual
          const a = document.createElement('a');
          a.href = whatsappUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          // Algunos navegadores requieren que el anchor esté en el DOM
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (err) {
          // Fallback a navegación en la misma pestaña
          window.location.href = whatsappUrl;
        }
      };

      // Abrir tras breve delay para dejar mostrar el toast
      setTimeout(openWhatsapp, 500);

    } catch (err) {
      console.error("Error completo:", err);
      toast.error("Error al procesar el pedido");
    }
  };

  const reiniciarCarrito = () => {
    setCarrito([]);
    localStorage.removeItem("carrito");
    setAlertaCheckout("");
    toast.success("Carrito reiniciado");
  };

  const cantidadTotal = carrito.reduce((acc, p) => acc + p.cantidad, 0);

  return (
    <>
      {/* BOTÓN FLOTANTE */}
      <button
        onClick={toggleModal}
        className="
          fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50
          bg-gradient-to-br from-indigo-600 to-purple-700 
          hover:from-indigo-700 hover:to-purple-800 
          text-white rounded-full shadow-2xl
          flex items-center justify-center
          w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24
          border-4 border-white/30
          transition-all hover:scale-110 active:scale-95 cursor-pointer
        "
      >
        <IoCart className="text-3xl sm:text-5xl lg:text-6xl" />

        {cantidadTotal > 0 && (
          <span className="
            absolute -top-3 -right-3 bg-red-500 text-white font-bold rounded-full
            border-4 border-white shadow-lg
            w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-lg
          ">
            {cantidadTotal > 99 ? "99+" : cantidadTotal}
          </span>
        )}
      </button>

      {/* MODAL CARRITO */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-5 relative">
              <h2 className="text-2xl font-bold text-center">Tu Carrito</h2>
              <button onClick={toggleModal} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2">
                <IoClose className="text-2xl cursor-pointer" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5">
              {carrito.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Tu carrito está vacío</p>
              ) : (
                <div className="space-y-4">
                  {carrito.map(p => (
                    <div key={p.id} className="bg-gray-50 rounded-xl p-4 flex gap-4 border border-slate-200">
                      {p.imagen_url ? (
                        <img src={p.imagen_url} alt={p.nombre} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold">{p.nombre}</h4>
                        <p className="text-sm text-gray-600">${p.precio.toLocaleString("es-CO")} c/u</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => actualizarCantidad(p.id, p.cantidad - 1)} className="w-8 h-8 rounded bg-white border border-slate-200 cursor-pointer">−</button>
                          <span className="w-12 text-center font-bold">{p.cantidad}</span>
                          <button onClick={() => actualizarCantidad(p.id, p.cantidad + 1)} className="w-8 h-8 rounded bg-white border border-slate-200 cursor-pointer">+</button>
                        </div>
                        {alertaStock?.id === p.id && <p className="text-red-600 text-xs mt-1">{alertaStock.mensaje}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${(p.precio * p.cantidad).toLocaleString("es-CO")}</p>
                        <button onClick={() => eliminarProducto(p.id)} className="text-red-500 mt-2 cursor-pointer">
                          <IoTrashBin />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {carrito.length > 0 && (
              <div className="border-t border-slate-200 p-5 bg-gray-50">
                <div className="flex justify-between text-xl font-bold mb-4">
                  <span>Total</span>
                  <span className="text-indigo-600">${total.toLocaleString("es-CO")}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={vaciarCarrito} className="py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-medium cursor-pointer">
                    Vaciar
                  </button>
                  <button onClick={abrirCheckout} className="py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold cursor-pointer">
                    Confirmar pedido
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-green-700 text-white p-6 text-center relative">
              <h2 className="text-2xl font-bold">Confirmar Pedido</h2>
              <button
                type="button"
                onClick={cerrarCheckout}
                className="absolute top-4 right-4 bg-white/25 hover:bg-white/40 rounded-full p-2 transition"
              >
                <IoClose className="text-2xl cursor-pointer" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {alertaCheckout && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center font-medium animate-pulse">
                  {alertaCheckout}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
                <input
                  type="text"
                  placeholder="Ej: Laura Gómez"
                  value={cliente.nombre}
                  onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>

              {/* TIPO DE ENTREGA – DOMICILIO PRIMERO Y POR DEFECTO */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">¿Cómo recibes tu pedido?</label>
                <div className="grid grid-cols-1 gap-3">
                  {/* DOMICILIO */}
                  <div
                    onClick={() => setEntrega("domicilio")}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${entrega === "domicilio"
                      ? "border-emerald-500 bg-emerald-50 shadow-lg"
                      : "border-gray-300 hover:border-gray-400"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                          {entrega === "domicilio" && <div className="w-3 h-3 bg-emerald-600 rounded-full" />}
                        </div>
                        <div>
                          <p className="font-bold text-emerald-700">Envío a domicilio</p>
                          <p className="text-sm text-gray-600">
                            {costoEnvio === 0 && minimoGratisConfig > 0 && total >= minimoGratisConfig ? (
                              <span className="text-emerald-600 font-bold">¡Gratis!</span>
                            ) : (
                              `Te lo llevamos donde estés • +$${Number(costoEnvioConfig).toLocaleString("es-CO")}`
                            )}
                          </p>
                          {minimoGratisConfig > 0 && total < minimoGratisConfig && (
                            <p className="text-xs text-indigo-500 mt-1">
                              ¡Gratis por compras desde ${Number(minimoGratisConfig).toLocaleString("es-CO")}!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RECOGER */}
                  <div
                    onClick={() => setEntrega("recoger")}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${entrega === "recoger"
                      ? "border-purple-500 bg-purple-50 shadow-lg"
                      : "border-gray-300 hover:border-gray-400"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full border-2 border-purple-600 flex items-center justify-center">
                          {entrega === "recoger" && <div className="w-3 h-3 bg-purple-600 rounded-full" />}
                        </div>
                        <div>
                          <p className="font-bold text-purple-700">Recoger en tienda</p>
                          <p className="text-sm text-gray-600">Pasas a buscarlo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dirección (solo si es domicilio) */}
              {entrega === "domicilio" && (
                <div className="animate-in slide-in-from-top duration-300">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección de Entrega</label>
                  <input
                    type="text"
                    placeholder="Conjunto / bloque / apartamento"
                    value={cliente.direccion}
                    onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                    className="w-full px-4 py-4 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50/50 transition"
                  />
                </div>
              )}

              {/* MÉTODOS DE PAGO */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Método de pago</label>
                <div className="space-y-3">

                  <div
                    onClick={() => setPago("efectivo")}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${pago === "efectivo" ? "border-emerald-500 bg-emerald-50 shadow-md" : "border-gray-300"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                        {pago === "efectivo" && <div className="w-3 h-3 bg-emerald-600 rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold flex items-center gap-2">
                          Efectivo contra entrega
                        </p>
                        <p className="text-sm text-gray-600">Pagas al recibir tu pedido</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPago("nequi")}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${pago === "nequi" ? "border-purple-600 bg-purple-50 shadow-md" : "border-gray-300"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-purple-600 flex items-center justify-center">
                        {pago === "nequi" && <div className="w-3 h-3 bg-purple-600 rounded-full" />}
                      </div>
                      <div>
                        <p className="font-bold text-purple-700">Nequi</p>
                        <p className="text-sm"><strong>{NEQUI_NUMERO}</strong> – {NOMBRE_TITULAR}</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPago("daviplata")}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${pago === "daviplata" ? "border-green-600 bg-green-50 shadow-md" : "border-gray-300"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-green-600 flex items-center justify-center">
                        {pago === "daviplata" && <div className="w-3 h-3 bg-green-600 rounded-full" />}
                      </div>
                      <div>
                        <p className="font-bold text-green-700">Daviplata</p>
                        <p className="text-sm"><strong>{DAVIPLATA_NUMERO}</strong> – {NOMBRE_TITULAR}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cambio solo si es efectivo + domicilio */}
              {pago === "efectivo" && entrega === "domicilio" && (
                <div className="animate-in slide-in-from-bottom duration-300">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ¿Con cuánto pagas? (para el cambio)
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 50000 (sin puntos ni comas)"
                    value={cambio}
                    onChange={(e) => setCambio(e.target.value)}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* TOTAL FINAL */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border-2 border-emerald-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-gray-800">Total a pagar</span>
                  <span className="text-4xl font-extrabold text-emerald-600">
                    ${totalFinal.toLocaleString("es-CO")}
                  </span>
                </div>
                {entrega === "domicilio" && (
                  <div className="space-y-1 mt-2">
                    <p className="text-sm text-center text-gray-600">
                      {costoEnvio === 0 && minimoGratisConfig > 0 && total >= minimoGratisConfig
                        ? "¡Envío gratis aplicado!"
                        : "Incluye envío a domicilio"}
                    </p>
                  </div>
                )}
              </div>

              {/* BOTONES FINALES */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={cerrarCheckout}
                  className="py-4 rounded-xl border-2 border-gray-400 text-gray-700 font-bold hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarPedido}
                  className="py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold shadow-xl hover:shadow-2xl active:scale-98 transition flex items-center justify-center gap-3 cursor-pointer"
                >
                  Enviar por WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}