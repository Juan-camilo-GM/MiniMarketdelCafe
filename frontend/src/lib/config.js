import { supabase } from "./supabase";

export const obtenerConfiguracion = async (clave) => {
    // 1. Revisar si hay un valor guardado en demo / local
    try {
        const localVal = localStorage.getItem(`demo_config_${clave}`);
        if (localVal !== null) {
            return localVal;
        }
    } catch (e) {
        // Ignorar si localStorage no está disponible
    }

    // 2. Consultar en Supabase
    try {
        const { data, error } = await supabase
            .from("configuracion")
            .select("valor")
            .eq("clave", clave)
            .single();

        if (error) {
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
    // 1. Siempre persistir en localStorage para Modo Demo y soporte offline
    try {
        localStorage.setItem(`demo_config_${clave}`, valor);
        window.dispatchEvent(new CustomEvent("configuracion_actualizada", {
            detail: { clave, valor }
        }));
    } catch (e) {
        console.warn("No se pudo guardar en localStorage", e);
    }

    // 2. Intentar guardar en Supabase si hay sesión real o permisos
    try {
        const { data, error } = await supabase
            .from("configuracion")
            .upsert({ clave, valor }, { onConflict: "clave" })
            .select();

        if (error) {
            console.warn("Supabase RLS al guardar (usando fallback demo):", error.message);
            // Retornamos éxito con los datos guardados en demo local
            return [{ clave, valor }];
        }
        return data;
    } catch (err) {
        console.warn("Excepción guardando configuracion (usando fallback demo):", err);
        return [{ clave, valor }];
    }
};

// Suscribe en tiempo real a cambios en la tabla `configuracion` y a eventos locales
export const subscribeConfiguracion = (clave, callback) => {
    const localHandler = (e) => {
        if (e.detail?.clave === clave) {
            callback(e.detail.valor);
        }
    };
    window.addEventListener("configuracion_actualizada", localHandler);

    const channel = supabase
        .channel(`configuracion_${clave}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'configuracion' },
            (payload) => {
                try {
                    const nue = payload.new;
                    if (!nue) return;
                    if (nue.clave === clave) callback(nue.valor);
                } catch (err) {
                    console.error('Error en handler realtime configuracion', err);
                }
            }
        )
        .subscribe();

    return () => {
        window.removeEventListener("configuracion_actualizada", localHandler);
        supabase.removeChannel(channel);
    };
};
