import { useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import {
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoAlertCircleOutline,
} from "react-icons/io5";

export const useOrderActions = (fetchPedidos, fetchProductosStockBajo) => {

    const actualizarEstado = async (id, nuevoEstado) => {
        try {
            const { data: pedido, error: errorPedido } = await supabase
                .from("pedidos")
                .select("*")
                .eq("id", id)
                .single();

            if (errorPedido || !pedido) {
                toast.error("Error al obtener los datos del pedido", {
                    icon: <IoAlertCircleOutline size={22} />,
                });
                return;
            }

            // === CONFIRMAR PEDIDO ===
            if (nuevoEstado === "confirmado" && pedido.estado !== "confirmado") {
                const productosConError = [];

                for (const prod of pedido.productos || []) {
                    const { data: productoActual, error: errorGet } = await supabase
                        .from("productos")
                        .select("stock")
                        .eq("id", prod.id)
                        .single();

                    if (errorGet || !productoActual) {
                        productosConError.push(prod.nombre || "ID: " + prod.id);
                        continue;
                    }

                    if (productoActual.stock - prod.cantidad < 0) {
                        toast.error(
                            `Stock insuficiente para "${prod.nombre}" (disponible: ${productoActual.stock}, solicitado: ${prod.cantidad})`,
                            { icon: <IoAlertCircleOutline size={24} />, duration: 8000 }
                        );
                        return;
                    }

                    const { error: errorUpdate } = await supabase
                        .from("productos")
                        .update({ stock: productoActual.stock - prod.cantidad })
                        .eq("id", prod.id);

                    if (errorUpdate) productosConError.push(prod.nombre);
                }

                if (productosConError.length > 0) {
                    toast.error(`Error al actualizar stock: ${productosConError.join(", ")}`, {
                        icon: <IoCloseCircleOutline size={22} />,
                        duration: 7000,
                    });
                    return;
                }
            }

            // === CANCELAR PEDIDO (devolver stock) ===
            if (nuevoEstado === "cancelado" && pedido.estado === "confirmado") {
                for (const prod of pedido.productos || []) {
                    const { data: productoActual } = await supabase
                        .from("productos")
                        .select("stock")
                        .eq("id", prod.id)
                        .single();

                    if (productoActual) {
                        await supabase
                            .from("productos")
                            .update({ stock: productoActual.stock + prod.cantidad })
                            .eq("id", prod.id);
                    }
                }
            }

            // === ACTUALIZAR ESTADO ===
            const { error } = await supabase
                .from("pedidos")
                .update({ estado: nuevoEstado })
                .eq("id", id);

            if (error) {
                toast.error("Error al actualizar el estado del pedido", {
                    icon: <IoCloseCircleOutline size={22} />,
                });
                return;
            }

            // === ÉXITO ===
            toast.success(
                nuevoEstado === "confirmado"
                    ? "Pedido confirmado y stock actualizado"
                    : nuevoEstado === "cancelado"
                        ? "Pedido cancelado y stock devuelto"
                        : "Estado actualizado correctamente",
                { icon: <IoCheckmarkCircleOutline size={24} /> }
            );

            if (fetchPedidos) fetchPedidos();
            if (fetchProductosStockBajo) fetchProductosStockBajo();

        } catch (err) {
            console.error("Error inesperado:", err);
            toast.error("Error inesperado al procesar el pedido", {
                icon: <IoCloseCircleOutline size={22} />,
            });
        }
    };

    const eliminarPedido = async (id) => {
        try {
            const { error } = await supabase.from("pedidos").delete().eq("id", id);
            if (error) throw error;
            toast.success("Pedido eliminado correctamente");
            if (fetchPedidos) fetchPedidos();
        } catch (error) {
            console.error("Error eliminando pedido:", error);
            toast.error("Error al eliminar el pedido");
        }
    };

    return { actualizarEstado, eliminarPedido };
};
