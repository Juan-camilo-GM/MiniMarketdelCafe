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
  try {
    const { data, error } = await supabase
      .from("pedidos")
      .insert([pedido])
      .select()
      .single();

    if (error) {
      console.warn("Supabase RLS o error al guardar pedido (usando fallback demo):", error.message);
      const demoPedidos = JSON.parse(localStorage.getItem("demo_pedidos") || "[]");
      const pedidoConId = { ...pedido, id: Date.now() };
      demoPedidos.unshift(pedidoConId);
      localStorage.setItem("demo_pedidos", JSON.stringify(demoPedidos));
      window.dispatchEvent(new Event("pedidos_updated"));
      return pedidoConId;
    }
    return data || true;
  } catch (err) {
    console.warn("Excepción guardando pedido (usando fallback demo):", err);
    try {
      const demoPedidos = JSON.parse(localStorage.getItem("demo_pedidos") || "[]");
      const pedidoConId = { ...pedido, id: Date.now() };
      demoPedidos.unshift(pedidoConId);
      localStorage.setItem("demo_pedidos", JSON.stringify(demoPedidos));
      window.dispatchEvent(new Event("pedidos_updated"));
      return pedidoConId;
    } catch (e) {
      return true;
    }
  }
};

// Obtener pedidos (combina pedidos remotos con pedidos generados en modo demo)
export async function obtenerPedidos() {
  let pedidosRemotos = [];
  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      pedidosRemotos = data;
    }
  } catch (e) {
    console.error("Error al obtener pedidos:", e);
  }

  try {
    const demoPedidos = JSON.parse(localStorage.getItem("demo_pedidos") || "[]");
    return [...demoPedidos, ...pedidosRemotos];
  } catch (e) {
    return pedidosRemotos;
  }
}

// Eliminar pedido
export async function eliminarPedido(id) {
  try {
    const demoPedidos = JSON.parse(localStorage.getItem("demo_pedidos") || "[]");
    const filtrados = demoPedidos.filter(p => p.id !== id);
    localStorage.setItem("demo_pedidos", JSON.stringify(filtrados));
  } catch (e) {}

  const { error } = await supabase
    .from("pedidos")
    .delete()
    .eq("id", id);

  if (error) {
    console.warn("Aviso al eliminar pedido en base de datos:", error.message);
    return true; // En modo demo permitimos reflejar el borrado sin error
  }
  return true;
}
