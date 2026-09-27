import CartLoader from "../../components/ui/CartLoader";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { IoCloudOfflineOutline, IoCloudUploadOutline, IoCheckmarkCircleOutline } from "react-icons/io5";
import toast from "react-hot-toast";

export default function OfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [ventasPendientes, setVentasPendientes] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const cargarVentas = () => {
    try {
      const sales = JSON.parse(localStorage.getItem("ventas_offline") || "[]");
      setVentasPendientes(sales);
    } catch (e) {
      console.error(e);
      setVentasPendientes([]);
    }
  };

  useEffect(() => {
    cargarVentas();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleUpdate = () => cargarVentas();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("ventas_offline_updated", handleUpdate);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("ventas_offline_updated", handleUpdate);
    };
  }, []);

  // Intentar sincronizar automáticamente al recuperar conexión
  useEffect(() => {
    if (isOnline && ventasPendientes.length > 0 && !syncing) {
      sincronizar();
    }
  }, [isOnline, ventasPendientes.length]);

  const sincronizar = async () => {
    if (ventasPendientes.length === 0) return;
    
    setSyncing(true);
    let exitosas = 0;
    const fallidas = [];

    for (const pedido of ventasPendientes) {
      try {
        const { error: errorPedido } = await supabase.from("pedidos").insert(pedido);
        if (errorPedido) throw errorPedido;

        // Descontar stock
        const ids = pedido.productos.map(p => p.id);
        if (ids.length > 0) {
            const { data: productosActuales } = await supabase.from("productos").select("id, stock").in("id", ids);
            const updates = pedido.productos.map(p => {
                const prod = productosActuales?.find(x => x.id === p.id);
                if (prod) {
                    return supabase.from("productos").update({ stock: prod.stock - p.cantidad }).eq("id", p.id);
                }
                return Promise.resolve();
            });
            await Promise.all(updates);
        }
        exitosas++;
      } catch (error) {
        console.error("Error sincronizando venta:", error);
        fallidas.push(pedido);
      }
    }

    localStorage.setItem("ventas_offline", JSON.stringify(fallidas));
    setVentasPendientes(fallidas);
    setSyncing(false);

    if (exitosas > 0) {
      toast.success(`${exitosas} ventas sincronizadas con la nube`);
    }
    if (fallidas.length > 0) {
      toast.error(`${fallidas.length} ventas no pudieron sincronizarse`);
    }
  };

  if (!isOnline && ventasPendientes.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 text-sm font-medium animate-in slide-in-from-bottom-5">
        <IoCloudOfflineOutline className="text-amber-400 text-lg" />
        Estás sin internet
      </div>
    );
  }

  if (ventasPendientes.length > 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-amber-500 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-3 z-50 text-sm font-medium animate-in slide-in-from-bottom-5">
        {syncing ? (
          <>
            <CartLoader size="small" />
            Sincronizando {ventasPendientes.length} ventas...
          </>
        ) : (
          <>
            <IoCloudOfflineOutline className="text-lg" />
            {ventasPendientes.length} ventas sin sincronizar
            {isOnline && (
              <button 
                onClick={sincronizar}
                className="ml-2 bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-colors"
                title="Sincronizar ahora"
              >
                <IoCloudUploadOutline size={16} />
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
