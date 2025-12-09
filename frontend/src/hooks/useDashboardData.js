import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const useDashboardData = (tabActivo) => {
    const [pedidos, setPedidos] = useState([]);
    const [productosStockBajo, setProductosStockBajo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingStock, setLoadingStock] = useState(true);

    const fetchPedidos = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("pedidos")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) console.error("Error cargando pedidos:", error);
        else setPedidos(data || []);

        setLoading(false);
    }, []);

    const fetchProductosStockBajo = useCallback(async () => {
        setLoadingStock(true);
        const { data, error } = await supabase
            .from("productos")
            .select("*")
            .lte("stock", 10)
            .order("stock", { ascending: true });

        if (error) {
            console.error("Error cargando productos con stock bajo:", error);
        } else {
            setProductosStockBajo(data || []);
        }
        setLoadingStock(false);
    }, []);

    return {
        pedidos,
        productosStockBajo,
        loading,
        loadingStock,
        fetchPedidos,
        fetchProductosStockBajo,
        setPedidos // Exported to allow optimistic updates or manual setting if needed
    };
};
