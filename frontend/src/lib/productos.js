import { supabase } from "./supabase";

// Obtener todos los productos
export async function obtenerProductos() {
  const { data, error } = await supabase
    .from("productos")
    .select(`
      id,
      nombre,
      precio,
      stock,
      categoria_id,
      imagen_url,
      is_featured,
      categorias (
        id,
        nombre
        )
    `);

  if (error) {
    console.error("Error al obtener productos", error);
    return [];
  }
  return data;
}

// Agregar producto
export async function agregarProducto(producto) {
  const { data, error } = await supabase
    .from("productos")
    .insert([producto])
    .select()
    .single();

  if (error) {
    console.error("Error al agregar producto", error);
    console.log("Objeto error completo", JSON.stringify(error, null, 2));
    return null;
  }
  return data;
}

// Actualizar producto
export async function actualizarProducto(id, producto) {
  const { data, error } = await supabase
    .from("productos")
    .update(producto)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar producto", error);
    return null;
  }
  return data;
}

// Eliminar producto
export async function eliminarProducto(id) {
  const { data, error } = await supabase
    .from("productos")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al eliminar producto", error);
    return null;
  }
  return data;
}

export const agregarPedido = async (pedido) => {
  const { data, error } = await supabase
    .from("pedidos")
    .insert([pedido])
    .select()
    .single();

  if (error) {
    console.error("Error al agregar pedido:", error);
    return null;
  }

  return data; // devolver la fila insertada
};


// Obtener pedidos
export async function obtenerPedidos() {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener pedidos:", error);
    return [];
  }
  return data;
}

// Eliminar pedido
export async function eliminarPedido(id) {
  const { error } = await supabase
    .from("pedidos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error al eliminar pedido:", error);
    return false;
  }
  return true;
}
