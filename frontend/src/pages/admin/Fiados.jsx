import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  IoPersonOutline, 
  IoCheckmarkCircleOutline, 
  IoCashOutline,
  IoPhonePortraitOutline,
  IoCardOutline
} from "react-icons/io5";
import toast from "react-hot-toast";

export default function Fiados() {
  const [fiados, setFiados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el pago
  const [modalPago, setModalPago] = useState(false);
  const [fiadoAPagar, setFiadoAPagar] = useState(null);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarFiados();
  }, []);

  const cargarFiados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("metodo_pago", "fiado")
        .eq("estado", "confirmado")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiados(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando el libro de fiados");
    } finally {
      setLoading(false);
    }
  };

  const agruparPorCliente = () => {
    const grupos = {};
    fiados.forEach(f => {
      const cliente = f.cliente_nombre || "Cliente Anónimo";
      if (!grupos[cliente]) {
        grupos[cliente] = {
          cliente,
          direccion: f.cliente_direccion || "Sin dirección",
          totalDeuda: 0,
          pedidos: []
        };
      }
      grupos[cliente].totalDeuda += Number(f.total);
      grupos[cliente].pedidos.push(f);
    });
    return Object.values(grupos);
  };

  const abrirModalPago = (pedido) => {
    setFiadoAPagar(pedido);
    setMetodoPago("efectivo");
    setModalPago(true);
  };

  const procesarPago = async () => {
    if (!fiadoAPagar) return;
    setProcesando(true);

    try {
      // 1. Marcar el pedido original como 'pagado'
      const { error: errorActualizar } = await supabase
        .from("pedidos")
        .update({ estado: "pagado" })
        .eq("id", fiadoAPagar.id);

      if (errorActualizar) throw errorActualizar;

      // 2. Crear un nuevo pedido "falso" para que ingrese al cierre de caja de HOY
      const pago = {
        cliente_nombre: `PAGO FIADO - ${fiadoAPagar.cliente_nombre}`,
        subtotal: fiadoAPagar.total,
        total: fiadoAPagar.total,
        estado: "confirmado",
        metodo_pago: metodoPago,
        productos: [{ nombre: "Abono / Pago de Fiado", precio: fiadoAPagar.total, cantidad: 1 }],
        created_at: new Date().toISOString()
      };

      const { error: errorNuevo } = await supabase.from("pedidos").insert(pago);
      if (errorNuevo) throw errorNuevo;

      toast.success("Pago registrado. Ingresó a la caja de hoy.");
      setModalPago(false);
      cargarFiados();
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar el pago");
    } finally {
      setProcesando(false);
    }
  };

  const grupos = agruparPorCliente();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <IoPersonOutline className="text-indigo-600" /> 
          Cuaderno de Fiados
        </h1>
        <p className="text-slate-500 mt-1">Lleva el control de las cuentas por cobrar a tus vecinos</p>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Revisando el cuaderno...</p>
        </div>
      ) : grupos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoCheckmarkCircleOutline size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">¡Todo al día!</h3>
          <p className="text-slate-500 mt-2">No hay vecinos con deudas pendientes actualmente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grupos.map((g, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">{g.cliente}</h3>
                <p className="text-sm text-slate-500">{g.direccion}</p>
              </div>
              <div className="p-5 flex-1 space-y-4">
                <div className="text-2xl font-black text-rose-600">
                  ${g.totalDeuda.toLocaleString("es-CO")}
                </div>
                <div className="space-y-3">
                  {g.pedidos.map(p => (
                    <div key={p.id} className="text-sm border border-slate-100 rounded-lg p-3 bg-white">
                      <div className="flex justify-between text-slate-500 text-xs mb-2">
                        <span>{new Date(p.created_at).toLocaleDateString()}</span>
                        <span className="font-bold text-slate-700">${Number(p.total).toLocaleString("es-CO")}</span>
                      </div>
                      <div className="text-slate-600 space-y-1">
                        {p.productos?.map((prod, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="truncate pr-2">{prod.cantidad}x {prod.nombre}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => abrirModalPago(p)}
                        className="mt-3 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <IoCheckmarkCircleOutline size={18} /> Saldar esta deuda
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Pago */}
      {modalPago && fiadoAPagar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Saldar Deuda</h3>
            <p className="text-slate-500 mb-6">¿Cómo pagó el vecino <b>{fiadoAPagar.cliente_nombre}</b> la suma de <b>${Number(fiadoAPagar.total).toLocaleString()}</b>?</p>
            
            <div className="space-y-3 mb-8">
              {[
                { id: "efectivo", label: "Efectivo", icon: <IoCashOutline /> },
                { id: "nequi", label: "Nequi", icon: <IoPhonePortraitOutline /> },
                { id: "daviplata", label: "Daviplata", icon: <IoPhonePortraitOutline /> },
                { id: "transferencia", label: "Transferencia", icon: <IoCardOutline /> }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMetodoPago(m.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    metodoPago === m.id 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-100 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 font-semibold">
                    {m.icon} <span className="capitalize">{m.label}</span>
                  </div>
                  {metodoPago === m.id && <IoCheckmarkCircleOutline size={20} />}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setModalPago(false)}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                disabled={procesando}
              >
                Cancelar
              </button>
              <button 
                onClick={procesarPago}
                disabled={procesando}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-indigo-500/20"
              >
                {procesando ? "Procesando..." : "Confirmar Pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
