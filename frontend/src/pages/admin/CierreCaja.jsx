import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  IoCashOutline, 
  IoCardOutline, 
  IoPhonePortraitOutline, 
  IoPrintOutline, 
  IoCalculatorOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline
} from "react-icons/io5";
import toast from "react-hot-toast";
import CartLoader from "../../components/ui/CartLoader";
import { getTodayDateString } from "../../lib/dateUtils";

export default function CierreCaja() {
  const [loading, setLoading] = useState(true);
  const [ventasHoy, setVentasHoy] = useState([]);
  const [efectivoContado, setEfectivoContado] = useState("");
  const [fechaArqueo, setFechaArqueo] = useState(getTodayDateString());

  // Resumen
  const [totales, setTotales] = useState({
    efectivo: 0,
    nequi: 0,
    daviplata: 0,
    transferencia: 0,
    gastos: 0,
    total: 0,
    cantidadPedidos: 0
  });

  const [modalGasto, setModalGasto] = useState(false);
  const [motivoGasto, setMotivoGasto] = useState("");
  const [montoGasto, setMontoGasto] = useState("");
  const [procesandoGasto, setProcesandoGasto] = useState(false);

  useEffect(() => {
    cargarVentasDia();
  }, [fechaArqueo]);

  const cargarVentasDia = async () => {
    setLoading(true);
    try {
      const [year, month, day] = fechaArqueo.split("-").map(Number);
      const inicioDia = new Date(year, month - 1, day, 0, 0, 0, 0);
      const finDia = new Date(year, month - 1, day, 23, 59, 59, 999);

      const { data, error } = await supabase
        .from("pedidos")
        .select("id, total, metodo_pago, estado, created_at, tipo_entrega")
        .gte("created_at", inicioDia.toISOString())
        .lte("created_at", finDia.toISOString())
        .in("estado", ["confirmado", "entregado", "completado"]);

      if (error) throw error;

      setVentasHoy(data || []);
      calcularTotales(data || []);
    } catch (error) {
      console.error("Error cargando ventas del día:", error);
      toast.error("No se pudieron cargar las ventas para el arqueo");
    } finally {
      setLoading(false);
    }
  };

  const calcularTotales = (ventas) => {
    let ef = 0;
    let nq = 0;
    let dv = 0;
    let tr = 0;
    let gastos = 0;

    ventas.forEach(v => {
      const monto = Number(v.total) || 0;
      const metodo = (v.metodo_pago || "").toLowerCase();
      
      if (metodo === "efectivo") ef += monto;
      else if (metodo === "nequi") nq += monto;
      else if (metodo === "daviplata") dv += monto;
      else if (metodo === "gasto_caja") gastos += monto;
      else if (metodo !== "fiado" && metodo !== "fiado_pagado") tr += monto; // Ignorar fiados activos
    });

    setTotales({
      efectivo: ef - gastos, // Descontamos de lo esperado en caja
      nequi: nq,
      daviplata: dv,
      transferencia: tr,
      gastos: gastos,
      total: ef + nq + dv + tr, // Total en ventas sin descontar gastos
      cantidadPedidos: ventas.filter(v => v.metodo_pago !== "gasto_caja").length
    });
  };

  const diferencia = (Number(efectivoContado) || 0) - totales.efectivo;
  const tieneDescuadre = Math.abs(diferencia) > 0 && efectivoContado !== "";

  const handleImprimirCierre = () => {
    window.print();
  };

  const registrarGastoCaja = async () => {
    if (!motivoGasto.trim() || !montoGasto || Number(montoGasto) <= 0) {
      toast.error("Ingresa un motivo y un monto válido");
      return;
    }

    setProcesandoGasto(true);
    try {
      const gasto = {
        cliente_nombre: `RETIRO CAJA MENOR: ${motivoGasto}`,
        subtotal: Number(montoGasto),
        total: Number(montoGasto),
        estado: "confirmado",
        metodo_pago: "gasto_caja",
        productos: [{ nombre: `Gasto: ${motivoGasto}`, precio: Number(montoGasto), cantidad: 1 }],
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from("pedidos").insert(gasto);
      if (error) throw error;

      toast.success("Retiro registrado correctamente");
      setModalGasto(false);
      setMotivoGasto("");
      setMontoGasto("");
      cargarVentasDia(); // Recargar para restar el gasto
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar salida de caja");
    } finally {
      setProcesandoGasto(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <IoCalculatorOutline className="text-indigo-600" /> 
            Cierre de Caja
          </h1>
          <p className="text-slate-500 mt-1">Arqueo diario y conciliación de ventas</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setModalGasto(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-rose-200 shadow-sm"
          >
            <IoCashOutline size={20} />
            Sacar Dinero (Gastos)
          </button>
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100 w-full sm:w-auto justify-between sm:justify-start">
            <label className="text-sm font-semibold text-slate-600 px-2">Fecha:</label>
            <input 
              type="date" 
              value={fechaArqueo}
              onChange={(e) => setFechaArqueo(e.target.value)}
              className="bg-slate-50 px-3 py-2 rounded-lg outline-none font-medium text-slate-700 border border-slate-200 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <CartLoader size="large" />
          <p className="text-slate-500 font-medium">Calculando flujo de caja...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Columna Izquierda: Ingresos por Método */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Desglose de Ingresos</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg"><IoCashOutline size={24} /></div>
                    <div>
                      <span className="font-bold block">Efectivo a Entregar</span>
                      <span className="text-xs font-medium opacity-80">(Ventas Efectivo - Gastos)</span>
                    </div>
                  </div>
                  <span className="text-xl font-black">${totales.efectivo.toLocaleString("es-CO")}</span>
                </div>

                {totales.gastos > 0 && (
                  <div className="flex items-center justify-between p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-100 rounded-lg"><IoCashOutline size={24} /></div>
                      <span className="font-bold">Salidas / Gastos</span>
                    </div>
                    <span className="text-xl font-black">-${totales.gastos.toLocaleString("es-CO")}</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg"><IoPhonePortraitOutline size={24} /></div>
                    <span className="font-bold">Nequi</span>
                  </div>
                  <span className="text-xl font-black">${totales.nequi.toLocaleString("es-CO")}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 rounded-lg"><IoPhonePortraitOutline size={24} /></div>
                    <span className="font-bold">Daviplata</span>
                  </div>
                  <span className="text-xl font-black">${totales.daviplata.toLocaleString("es-CO")}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><IoCardOutline size={24} /></div>
                    <span className="font-bold">Otras Transferencias</span>
                  </div>
                  <span className="text-xl font-black">${totales.transferencia.toLocaleString("es-CO")}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Total Ventas ({totales.cantidadPedidos} pedidos)</span>
                <span className="text-3xl font-black text-slate-800">${totales.total.toLocaleString("es-CO")}</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Arqueo Físico */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 print:hidden">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Arqueo Físico</h3>
              <p className="text-sm text-slate-500 mb-6">Cuenta el dinero en el cajón y compáralo con el sistema.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Efectivo Real Contado ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input 
                      type="number"
                      value={efectivoContado}
                      onChange={(e) => setEfectivoContado(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-2xl font-black text-slate-800 transition-all"
                    />
                  </div>
                </div>

                {efectivoContado !== "" && (
                  <div className={`p-5 rounded-xl border ${tieneDescuadre ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'} transition-colors`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-full ${tieneDescuadre ? 'bg-amber-200 text-amber-700' : 'bg-emerald-200 text-emerald-700'}`}>
                        {tieneDescuadre ? <IoWarningOutline size={20} /> : <IoCheckmarkCircleOutline size={20} />}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold ${tieneDescuadre ? 'text-amber-800' : 'text-emerald-800'}`}>
                          {tieneDescuadre ? "Descuadre Detectado" : "Caja Cuadrada Perfectamente"}
                        </h4>
                        <p className={`text-sm mt-1 ${tieneDescuadre ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {diferencia > 0 
                            ? `Sobran $${Math.abs(diferencia).toLocaleString("es-CO")} en efectivo.` 
                            : diferencia < 0 
                              ? `Faltan $${Math.abs(diferencia).toLocaleString("es-CO")} en efectivo.` 
                              : "El dinero físico coincide exactamente con el sistema."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={handleImprimirCierre}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-800/20"
                >
                  <IoPrintOutline size={20} /> Imprimir Cierre
                </button>
              </div>
            </div>

            {/* Ticket Impresión (Oculto en pantalla, visible al imprimir) */}
            <div className="hidden print:block text-black bg-white">
              <h2 className="text-2xl font-bold text-center mb-2">TICKET CIERRE DE CAJA</h2>
              <p className="text-center mb-6 border-b border-black pb-4">Fecha: {fechaArqueo}</p>
              
              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between"><span>Ventas Efectivo:</span> <span>${(totales.efectivo + totales.gastos).toLocaleString()}</span></div>
                {totales.gastos > 0 && (
                  <div className="flex justify-between text-rose-600"><span>Salidas/Gastos:</span> <span>-${totales.gastos.toLocaleString()}</span></div>
                )}
                <div className="flex justify-between font-bold"><span>Efectivo Esperado:</span> <span>${totales.efectivo.toLocaleString()}</span></div>
                <div className="flex justify-between mt-1"><span>Ventas Nequi:</span> <span>${totales.nequi.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Ventas Daviplata:</span> <span>${totales.daviplata.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Ventas Transferencia:</span> <span>${totales.transferencia.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold border-t border-black pt-2 mt-2">
                  <span>TOTAL VENTAS:</span> <span>${totales.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>CANTIDAD PEDIDOS:</span> <span>{totales.cantidadPedidos}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm border-t-2 border-black pt-4">
                <div className="flex justify-between"><span>Efectivo Sistema:</span> <span>${totales.efectivo.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Efectivo Físico (Arqueo):</span> <span>${Number(efectivoContado || 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold border-t border-black pt-2">
                  <span>DIFERENCIA:</span> <span>${diferencia.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-center mt-12 text-xs">_______________________________<br/>Firma Responsable</p>
            </div>
          </div>

        </div>
      )}

      {/* Modal de Gastos de Caja Menor */}
      {modalGasto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Sacar Dinero de Caja</h3>
            <p className="text-slate-500 mb-6 text-sm">Registra cualquier salida de efectivo (compras de tienda, pago de servicios, etc.) para que cuadre el arqueo.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Motivo / Descripción</label>
                <input 
                  type="text" 
                  value={motivoGasto}
                  onChange={(e) => setMotivoGasto(e.target.value)}
                  placeholder="Ej: Pago de recibo de agua"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Valor a retirar ($)</label>
                <input 
                  type="number" 
                  value={montoGasto}
                  onChange={(e) => setMontoGasto(e.target.value)}
                  placeholder="Ej: 15000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setModalGasto(false)}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                disabled={procesandoGasto}
              >
                Cancelar
              </button>
              <button 
                onClick={registrarGastoCaja}
                disabled={procesandoGasto}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-rose-500/20"
              >
                {procesandoGasto ? "Procesando..." : "Confirmar Retiro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
