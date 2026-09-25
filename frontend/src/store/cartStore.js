import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

const useCartStore = create(
  persist(
    (set, get) => ({
      carrito: [],

      agregarProducto: (producto) => {
        const { carrito } = get();
        const existe = carrito.find((p) => p.id === producto.id);

        if (existe) {
          if (existe.cantidad + 1 > producto.stock) {
            return { error: `Stock insuficiente para "${producto.nombre}"`, id: producto.id };
          }
          set({
            carrito: carrito.map((p) =>
              p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
            ),
          });
          return { success: `"${producto.nombre}" +1 agregado al carrito`, id: producto.id };
        } else {
          if (producto.stock < 1) {
             return { error: `No hay stock disponible de "${producto.nombre}"`, id: producto.id };
          }
          set({ carrito: [...carrito, { ...producto, cantidad: 1 }] });
          return { success: `"${producto.nombre}" agregado al carrito`, id: producto.id };
        }
      },

      actualizarCantidad: (productoId, nuevaCantidad, productos) => {
        const { carrito } = get();
        
        if (nuevaCantidad <= 0) {
          set({ carrito: carrito.filter((p) => p.id !== productoId) });
          return { success: "Producto eliminado del carrito", id: productoId };
        } else {
          const productoOriginal = productos.find((p) => p.id === productoId);

          if (productoOriginal) {
            if (nuevaCantidad > productoOriginal.stock) {
              return { error: `Stock insuficiente para "${productoOriginal.nombre}"`, id: productoId };
            }
            set({
              carrito: carrito.map((p) =>
                p.id === productoId ? { ...p, cantidad: nuevaCantidad } : p
              ),
            });
            return { success: `Cantidad de "${productoOriginal.nombre}" actualizada`, id: productoId };
          }
        }
        return null;
      },

      eliminarProducto: (id) => {
        set((state) => ({
          carrito: state.carrito.filter((p) => p.id !== id),
        }));
      },

      vaciarCarrito: () => {
        set({ carrito: [] });
      },
    }),
    {
      name: 'carrito', // nombre del item en localStorage
    }
  )
);

export default useCartStore;
