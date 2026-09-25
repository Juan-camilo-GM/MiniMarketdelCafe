import { useState, useEffect } from "react";
import { obtenerConfiguracion, guardarConfiguracion } from "../../lib/config";
import toast from "react-hot-toast";
import { IoSaveOutline, IoLogoWhatsapp, IoCardOutline, IoMegaphoneOutline } from "react-icons/io5";

export default function Configuracion() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [whatsapp, setWhatsapp] = useState("573117863431");
  const [nequi, setNequi] = useState("3154186754");
  const [daviplata, setDaviplata] = useState("3154186754");
  const [titular, setTitular] = useState("Johana González");
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
    setSaving(true);
    const [okWhatsapp, okNequi, okDaviplata, okTitular, okMegafono] = await Promise.all([
      guardarConfiguracion("whatsapp_numero", whatsapp),
      guardarConfiguracion("nequi_numero", nequi),
      guardarConfiguracion("daviplata_numero", daviplata),
      guardarConfiguracion("nombre_titular", titular),
      guardarConfiguracion("mensaje_megafono", mensajeMegafono),
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configuración de Pagos</h1>
          <p className="text-gray-500 mt-1">Configura tus números de contacto y cuentas de recaudo.</p>
        </div>
        <button
          onClick={guardar}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <IoSaveOutline className="text-xl" />
          )}
          <span>Guardar Cambios</span>
        </button>
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
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="573001234567"
              />
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
                onChange={(e) => setTitular(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: Juan Pérez"
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <IoMegaphoneOutline className="text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Megáfono (Anuncio Web)</h2>
            <p className="text-sm text-gray-500 mt-1">Escribe un anuncio que aparecerá en vivo a todos los clientes en la tienda virtual.</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Mensaje del Megáfono (Déjalo vacío para ocultarlo)
          </label>
          <input
            type="text"
            value={mensajeMegafono}
            onChange={(e) => setMensajeMegafono(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="Ej: 🍞 ¡Acaba de salir Pan Caliente! Haz tu pedido ahora."
          />
        </div>
      </div>
    </div>
  );
}
