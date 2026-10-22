import { useState, useEffect } from "react";
import CartLoader from "../../components/ui/CartLoader";
import { obtenerConfiguracion, guardarConfiguracion } from "../../lib/config";
import toast from "react-hot-toast";
import { IoSaveOutline, IoLogoWhatsapp, IoCardOutline, IoMegaphoneOutline, IoInformationCircleOutline } from "react-icons/io5";

export default function Configuracion() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [whatsapp, setWhatsapp] = useState("573001234567");
  const [nequi, setNequi] = useState("3001234567");
  const [daviplata, setDaviplata] = useState("3001234567");
  const [titular, setTitular] = useState("Administrador Demo");
  const [mensajeMegafono, setMensajeMegafono] = useState("");

  const cargarConfig = async () => {
    setLoading(true);
    const valWhatsapp = await obtenerConfiguracion("whatsapp_numero");
    const valNequi = await obtenerConfiguracion("nequi_numero");
    const valDaviplata = await obtenerConfiguracion("daviplata_numero");
    const valTitular = await obtenerConfiguracion("nombre_titular");
    const valMegafono = await obtenerConfiguracion("mensaje_megafono");

    if (valWhatsapp !== null) setWhatsapp(valWhatsapp);
    if (valNequi !== null) setNequi(valNequi);
    if (valDaviplata !== null) setDaviplata(valDaviplata);
    if (valTitular !== null) setTitular(valTitular);
    if (valMegafono !== null) setMensajeMegafono(valMegafono);
    
    setLoading(false);
  };

  useEffect(() => {
    cargarConfig();
  }, []);

  const guardar = async () => {
    // Validaciones para prevenir abusos
    const cleanWhatsapp = whatsapp.trim().replace(/\D/g, "");
    if (cleanWhatsapp.length > 15) {
      toast.error("El número de WhatsApp no puede tener más de 15 dígitos");
      return;
    }
    if (titular.trim().length > 60) {
      toast.error("El nombre del titular no puede exceder 60 caracteres");
      return;
    }
    if (mensajeMegafono.trim().length > 150) {
      toast.error("El mensaje del megáfono no puede exceder 150 caracteres");
      return;
    }

    setSaving(true);
    const [okWhatsapp, okNequi, okDaviplata, okTitular, okMegafono] = await Promise.all([
      guardarConfiguracion("whatsapp_numero", cleanWhatsapp || whatsapp.trim()),
      guardarConfiguracion("nequi_numero", nequi.trim().slice(0, 20)),
      guardarConfiguracion("daviplata_numero", daviplata.trim().slice(0, 20)),
      guardarConfiguracion("nombre_titular", titular.trim().slice(0, 60)),
      guardarConfiguracion("mensaje_megafono", mensajeMegafono.trim().slice(0, 150)),
    ]);

    if (okWhatsapp && okNequi && okDaviplata && okTitular && okMegafono) {
      toast.success("Configuración actualizada correctamente");
    } else {
      toast.error("Error al actualizar la configuración");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CartLoader size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configuración del Minimercado</h1>
          <p className="text-gray-500 mt-1">Configura el WhatsApp de recepción de pedidos y datos de pago.</p>
        </div>
        <button
          onClick={guardar}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? (
            <CartLoader size="small" />
          ) : (
            <IoSaveOutline className="text-xl" />
          )}
          <span>Guardar Cambios</span>
        </button>
      </div>

      {/* Nota explicativa de demo */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-blue-900">
        <IoInformationCircleOutline className="text-2xl text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <p className="font-semibold mb-0.5">¿Quieres probar la recepción de pedidos en tu teléfono?</p>
          <p className="text-blue-800">
            Puedes ingresar aquí tu propio número de WhatsApp (ej: <code>573001234567</code>) y guardar. Cuando realices un pedido de prueba desde el carrito de compras, el enlace de WhatsApp se generará directamente hacia tu número.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <IoLogoWhatsapp className="text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">WhatsApp de Pedidos</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Número de WhatsApp (con código de país ej. 57)
              </label>
              <input
                type="text"
                value={whatsapp}
                maxLength={16}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="573001234567"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                A este número se enviarán los mensajes automáticos con los pedidos de la tienda.
              </p>
            </div>
          </div>
        </div>

        {/* Cuentas de Cobro Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <IoCardOutline className="text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Cuentas Bancarias</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nombre del Titular
              </label>
              <input
                type="text"
                value={titular}
                maxLength={60}
                onChange={(e) => setTitular(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: Administrador Demo"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nequi
                </label>
                <input
                  type="text"
                  value={nequi}
                  maxLength={15}
                  onChange={(e) => setNequi(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Número Nequi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Daviplata
                </label>
                <input
                  type="text"
                  value={daviplata}
                  maxLength={15}
                  onChange={(e) => setDaviplata(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Número Daviplata"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Megáfono Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <IoMegaphoneOutline className="text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Megáfono (Anuncio Web)</h2>
            <p className="text-sm text-gray-500 mt-1">Escribe un anuncio que aparecerá en vivo a todos los clientes en la tienda virtual.</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs text-amber-900">
          <IoInformationCircleOutline className="text-lg shrink-0 mt-0.5 text-amber-600" />
          <p>
            <strong>Importante:</strong> Para que el anuncio se publique o se actualice en el catálogo, debes hacer clic en el botón <strong>"Guardar Cambios"</strong> (arriba a la derecha).
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Mensaje del Megáfono (Déjalo vacío para ocultarlo)
          </label>
          <input
            type="text"
            value={mensajeMegafono}
            maxLength={150}
            onChange={(e) => setMensajeMegafono(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="Ej: ¡Acaba de salir Pan Caliente! Haz tu pedido ahora."
          />
        </div>
      </div>
    </div>
  );
}
