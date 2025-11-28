import { supabase } from "./supabase";

export async function obtenerCategorias() {
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre");

  if (error) {
    console.error("Error al obtener categorías", error);
    return [];
  }

  return data;
}
