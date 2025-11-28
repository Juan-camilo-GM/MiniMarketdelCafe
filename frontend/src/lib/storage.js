import { supabase } from "./supabase";

/**
 * Sube un archivo al bucket 'productos' y devuelve la URL pública.
 * @param {File} file
 * @returns {string|null} URL pública o null en error
 */
export async function subirImagen(file) {
  if (!file) return null;

  // Path único
  const filePath = `productos/${Date.now()}-${file.name.replace(/\s/g, "_")}`;

  // Subida con upsert (sobrescribe si ya existe)
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("productos")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error("Error subiendo imagen:", uploadError);
    return null;
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from("productos")
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    console.error("No se generó URL pública para la imagen");
    return null;
  }

  return urlData.publicUrl;
}
