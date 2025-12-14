import { supabase } from "./supabase";

export const obtenerConfiguracion = async (clave) => {
    try {
        const { data, error } = await supabase
            .from("configuracion")
            .select("valor")
            .eq("clave", clave)
            .single();

        if (error) {
            // Si el error es que no hay filas, retornamos null (config no existe)
            if (error.code === 'PGRST116') return null;
            console.error("Error obteniendo configuracion:", error);
            return null;
        }
        return data?.valor;
    } catch (err) {
        console.error("Excepción en obtenerConfiguracion:", err);
        return null;
    }
};

export const guardarConfiguracion = async (clave, valor) => {
    try {
        // Upsert: inserta o actualiza si la clave ya existe
        const { data, error } = await supabase
            .from("configuracion")
            .upsert({ clave, valor }, { onConflict: "clave" })
            .select();

        if (error) {
            console.error("Error guardando configuracion:", error);
            return null;
        }
        return data;
    } catch (err) {
        console.error("Excepción en guardarConfiguracion:", err);
        return null;
    }
};
