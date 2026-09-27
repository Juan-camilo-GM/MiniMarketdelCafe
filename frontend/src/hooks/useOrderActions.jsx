import { useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import {
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoAlertCircleOutline,
} from "react-icons/io5";

export const useOrderActions = (fetchPedidos, fetchProductosStockBajo) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const actualizarEstado = async (id, nuevoEstado) => {
        if (isProcessing) return;
        setIsProcessing(true);
        const toastId = toast.loading("Procesando pedido...");
        try {
            const { data: pedido, error: errorPedido } = await supabase
                .from("pedidos")
                .select("*")
                .eq("id", id)
                .single();

            if (errorPedido || !pedido) {
                toast.error("Error al obtener los datos del pedido", { id: toastId, icon: <IoAlertCircleOutline size={22} /> });
                return;
            }

            // === CONFIRMAR PEDIDO ===
            if (nuevoEstado === "confirmado" && pedido.estado !== "confirmado") {
                const productosConError = [];
                const ids = pedido.productos?.map(p => p.id) || [];
                
                if (ids.length > 0) {
                    const { data: productosActuales, error: errorGet } = await supabase
                        .from("productos")
                        .select("id, stock, nombre")
                        .in("id", ids);

                    if (errorGet || !productosActuales) {
                        toast.error("Error al verificar inventario", { id: toastId });
                        return;
                    }

                    // Verificar stock primero
                    for (const prod of pedido.productos) {
                        const productoActual = productosActuales.find(p => p.id === prod.id);
                        if (!productoActual) {
                            productosConError.push(prod.nombre || "ID: " + prod.id);
                            continue;
                        }

                        if (productoActual.stock - prod.cantidad < 0) {
                            toast.error(`Stock insuficiente para "${prod.nombre}" (disponible: ${productoActual.stock}, solicitado: ${prod.cantidad})`, { id: toastId, icon: <IoAlertCircleOutline size={24} />, duration: 8000 });
                            return;
                        }
                    }

                    // Actualizar stock en paralelo
                    const updates = pedido.productos.map(prod => {
                        const productoActual = productosActuales.find(p => p.id === prod.id);
                        if (productoActual) {
                            return supabase
                                .from("productos")
                                .update({ stock: productoActual.stock - prod.cantidad })
                                .eq("id", prod.id);
                        }
                        return Promise.resolve();
                    });
                    await Promise.all(updates);
                }
            }

            // === CANCELAR PEDIDO (devolver stock) ===
            if (nuevoEstado === "cancelado" && pedido.estado === "confirmado") {
                const ids = pedido.productos?.map(p => p.id) || [];
                if (ids.length > 0) {
                    const { data: productosActuales } = await supabase
                        .from("productos")
                        .select("id, stock")
                        .in("id", ids);

                    const updates = pedido.productos.map(prod => {
                        const productoActual = productosActuales?.find(p => p.id === prod.id);
                        if (productoActual) {
                            return supabase
                                .from("productos")
                                .update({ stock: productoActual.stock + prod.cantidad })
                                .eq("id", prod.id);
                        }
                        return Promise.resolve();
                    });
                    await Promise.all(updates);
                }
            }

            // === ACTUALIZAR ESTADO ===
            const { error } = await supabase
                .from("pedidos")
                .update({ estado: nuevoEstado })
                .eq("id", id);

            if (error) {
                toast.error("Error al actualizar el estado del pedido", { id: toastId, icon: <IoCloseCircleOutline size={22} /> });
                return;
            }

            // === ÉXITO ===
            toast.success(
                nuevoEstado === "confirmado"
                    ? "Pedido confirmado y stock actualizado"
                    : nuevoEstado === "cancelado"
                        ? "Pedido cancelado y stock devuelto"
                        : "Estado actualizado correctamente",
                { id: toastId }
            );

            if (fetchPedidos) fetchPedidos();
            if (fetchProductosStockBajo) fetchProductosStockBajo();

        } catch (err) {
            console.error("Error inesperado:", err);
            toast.error("Error inesperado al procesar el pedido", { id: toastId, icon: <IoCloseCircleOutline size={22} /> });
        } finally {
            setIsProcessing(false);
        }
    };

    const eliminarPedido = async (id) => {
        if (isProcessing) return;
        setIsProcessing(true);
        const toastId = toast.loading("Eliminando pedido...");
        try {
            const { error } = await supabase.from("pedidos").delete().eq("id", id);
            if (error) throw error;
            toast.success("Pedido eliminado correctamente", { id: toastId });
            if (fetchPedidos) fetchPedidos();
        } catch (error) {
            console.error("Error eliminando pedido:", error);
            toast.error("Error al eliminar el pedido", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return { actualizarEstado, eliminarPedido, isProcessing };
};
