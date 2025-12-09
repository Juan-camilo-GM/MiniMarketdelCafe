import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { IoClose, IoCameraOutline, IoSearch } from "react-icons/io5";
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from "react-icons/io5";
import toast from "react-hot-toast";

export const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200`}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <IoClose size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Componente de búsqueda de productos
const ProductoSearch = ({ productos, onProductoSelect }) => {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const productosFiltrados = productos.filter(prod =>
    prod.nombre.toLowerCase().includes(busqueda.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="relative">
      <div className="relative">
        <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setMostrarResultados(true);
          }}
          onFocus={() => setMostrarResultados(true)}
          onBlur={() => setTimeout(() => setMostrarResultados(false), 200)}
          placeholder="Buscar producto..."
          className="w-full pl-10 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
        />
      </div>

      {mostrarResultados && busqueda && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
          {productosFiltrados.length === 0 ? (
            <div className="p-4 text-slate-500 text-sm text-center">No se encontraron productos</div>
          ) : (
            productosFiltrados.map((prod) => (
              <button
                key={prod.id}
                onClick={() => {
                  onProductoSelect(prod);
                  setBusqueda("");
                  setMostrarResultados(false);
                }}
                className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
              >
                <div className="font-medium text-slate-800">{prod.nombre}</div>
                <div className="text-xs text-slate-500">Stock: {prod.stock}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const Modals = ({
  modalProveedor,
  modalPedido,
  modalFactura,
  setModalProveedor,
  setModalPedido,
  setModalFactura,
  proveedores,
  productos,
  onRefresh,
}) => {
  // Estados para factura
  const [formFactura, setFormFactura] = useState({
    proveedor_id: "",
    numero_factura: "",
    monto: "",
    fecha: new Date().toISOString().split('T')[0],
    descripcion: "",
    imagen: null,
    imagen_preview: null,
  });

  // Estados para pedido
  const [formPedido, setFormPedido] = useState({
    proveedor_id: "",
    descripcion: "",
    productos: [],
    total: 0,
    estado: "pendiente",
    fecha_entrega: "",
  });

  // Estados para proveedor
  const [formProveedor, setFormProveedor] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    productos_sum: "",
  });

  // Estados para producto en pedido
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [precioProducto, setPrecioProducto] = useState("");

  // Función para guardar factura CON IMAGEN
  const guardarFactura = async () => {
    if (!formFactura.proveedor_id || !formFactura.numero_factura.trim() || !formFactura.monto) {
      toast.error("Proveedor, número de factura y monto son requeridos", {
        icon: <IoAlertCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }

    try {
      let imagen_url = null;

      // Subir imagen si existe
      if (formFactura.imagen) {
        const fileExt = formFactura.imagen.name.split('.').pop();
        const fileName = `${formFactura.numero_factura.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExt}`;

        // Subir a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('facturas') // Asegúrate que el bucket se llama 'facturas'
          .upload(fileName, formFactura.imagen);

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('facturas')
          .getPublicUrl(fileName);

        imagen_url = urlData?.publicUrl;
      }

      const facturaData = {
        proveedor_id: formFactura.proveedor_id,
        numero_factura: formFactura.numero_factura,
        monto: parseFloat(formFactura.monto),
        fecha: formFactura.fecha,
        descripcion: formFactura.descripcion || null,
        imagen_url: imagen_url // Guardar la URL
      };

      const { error } = await supabase
        .from("facturas")
        .insert([facturaData]);

      if (error) throw error;

      toast.success("Factura registrada exitosamente", {
        icon: <IoCheckmarkCircleOutline size={22} />,
        duration: 4000,
      });

      setModalFactura(false);
      resetFormFactura();
      onRefresh();

    } catch (error) {
      console.error("Error guardando factura:", error);

      const mensaje = error.message?.includes("network")
        ? "Error de conexión. Revisa tu internet e intenta de nuevo."
        : error.message || "Error al guardar la factura";

      toast.error(mensaje, {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 6000,
      });
    }
  };

  // Función para guardar pedido
  const guardarPedido = async () => {
    if (!formPedido.proveedor_id) {
      toast.error("Selecciona un proveedor", {
        icon: <IoAlertCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }

    if (formPedido.productos.length === 0) {
      toast.error("Agrega al menos un producto al pedido", {
        icon: <IoAlertCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }

    try {
      const pedidoData = {
        proveedor_id: formPedido.proveedor_id,
        descripcion: formPedido.descripcion,
        productos: formPedido.productos,
        total: formPedido.total,
        estado: "pendiente",
        fecha_entrega: formPedido.fecha_entrega || null,
      };

      const { error } = await supabase
        .from("pedidos_proveedor")
        .insert([pedidoData]);

      if (error) throw error;

      toast.success("Pedido registrado exitosamente", {
        icon: <IoCheckmarkCircleOutline size={22} />,
        duration: 4000,
      });

      setModalPedido(false);
      resetFormPedido();
      onRefresh();

    } catch (error) {
      console.error("Error guardando pedido:", error);

      const mensaje = error.message?.includes("network")
        ? "Error de conexión. Revisa tu internet e intenta de nuevo."
        : error.message || "Error al guardar el pedido";

      toast.error(mensaje, {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 6000,
      });
    }
  };

  // Función para guardar proveedor
  const guardarProveedor = async () => {
    if (!formProveedor.nombre.trim()) {
      toast.error("El nombre del proveedor es requerido", {
        icon: <IoAlertCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("proveedores")
        .insert([formProveedor]);

      if (error) throw error;

      toast.success("Proveedor registrado exitosamente", {
        icon: <IoCheckmarkCircleOutline size={22} />,
        duration: 4000,
      });

      setModalProveedor(false);
      resetFormProveedor();
      onRefresh();

    } catch (error) {
      console.error("Error guardando proveedor:", error);

      const mensaje = error.message?.includes("network")
        ? "Error de conexión. Revisa tu internet e intenta de nuevo."
        : error.message || "Error al guardar el proveedor";

      toast.error(mensaje, {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 6000,
      });
    }
  };

  // Funciones auxiliares para pedidos
  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setPrecioProducto(producto.precio || "");
  };

  const agregarProductoAlPedido = () => {
    if (!productoSeleccionado || !cantidadProducto || !precioProducto) {
      toast.error("Completa todos los campos del producto", {
        icon: <IoAlertCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }

    const nuevoProducto = {
      id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      cantidad: parseInt(cantidadProducto),
      precio_unitario: parseFloat(precioProducto),
      subtotal: parseInt(cantidadProducto) * parseFloat(precioProducto)
    };

    setFormPedido(prev => ({
      ...prev,
      productos: [...prev.productos, nuevoProducto],
      total: prev.total + nuevoProducto.subtotal
    }));

    setProductoSeleccionado(null);
    setCantidadProducto(1);
    setPrecioProducto("");
  };

  const quitarProductoDelPedido = (index) => {
    const producto = formPedido.productos[index];
    setFormPedido(prev => ({
      ...prev,
      productos: prev.productos.filter((_, i) => i !== index),
      total: prev.total - producto.subtotal
    }));
  };

  // Resetear formularios
  const resetFormFactura = () => {
    setFormFactura({
      proveedor_id: "",
      numero_factura: "",
      monto: "",
      fecha: new Date().toISOString().split('T')[0],
      descripcion: "",
      imagen: null,
      imagen_preview: null,
    });
  };

  const resetFormPedido = () => {
    setFormPedido({
      proveedor_id: "",
      descripcion: "",
      productos: [],
      total: 0,
      estado: "pendiente",
      fecha_entrega: "",
    });
    setProductoSeleccionado(null);
    setCantidadProducto(1);
    setPrecioProducto("");
  };

  const resetFormProveedor = () => {
    setFormProveedor({
      nombre: "",
      contacto: "",
      telefono: "",
      email: "",
      direccion: "",
      productos_sum: "",
    });
  };

  const handleImagenFactura = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecciona un archivo de imagen", {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen es muy grande. Máximo 5MB", {
        icon: <IoCloseCircleOutline size={22} />,
        duration: 4000,
      });
      return;
    }

    setFormFactura(prev => ({
      ...prev,
      imagen: file,
      imagen_preview: URL.createObjectURL(file)
    }));
  };

  return (
    <>
      {/* Modal Nueva Factura */}
      <Modal
        isOpen={modalFactura}
        onClose={() => {
          setModalFactura(false);
          resetFormFactura();
        }}
        title="Nueva Factura"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Proveedor *
            </label>
            <select
              value={formFactura.proveedor_id}
              onChange={(e) => setFormFactura({ ...formFactura, proveedor_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              required
            >
              <option value="">Selecciona un proveedor</option>
              {proveedores.map(prov => (
                <option key={prov.id} value={prov.id}>{prov.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Número de Factura *
            </label>
            <input
              type="text"
              placeholder="Ej: FAC-001-2024"
              value={formFactura.numero_factura}
              onChange={(e) => setFormFactura({ ...formFactura, numero_factura: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Monto ($) *
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={formFactura.monto}
              onChange={(e) => setFormFactura({ ...formFactura, monto: e.target.value })}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Fecha de Factura *
            </label>
            <input
              type="date"
              value={formFactura.fecha}
              onChange={(e) => setFormFactura({ ...formFactura, fecha: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Notas (opcional)
            </label>
            <textarea
              placeholder="Información adicional sobre la factura"
              value={formFactura.descripcion || ""}
              onChange={(e) => setFormFactura({ ...formFactura, descripcion: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Imagen de la Factura (opcional)
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <IoCameraOutline className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">
                      {formFactura.imagen ? formFactura.imagen.name :
                        "Haz clic para subir una imagen"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG (Max. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImagenFactura}
                  />
                </label>
              </div>

              {formFactura.imagen_preview && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Vista previa:</p>
                  <div className="relative group">
                    <img
                      src={formFactura.imagen_preview}
                      alt="Vista previa de la factura"
                      className="w-full max-h-48 object-contain rounded-xl border border-slate-200"
                    />
                    <button
                      onClick={() => {
                        setFormFactura(prev => ({
                          ...prev,
                          imagen: null,
                          imagen_preview: null
                        }));
                      }}
                      className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-full hover:bg-rose-700 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <IoClose size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setModalFactura(false);
                resetFormFactura();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardarFactura}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all"
            >
              Guardar Factura
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Nuevo Pedido */}
      <Modal
        isOpen={modalPedido}
        onClose={() => {
          setModalPedido(false);
          resetFormPedido();
        }}
        title="Nuevo Pedido a Proveedor"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Proveedor *
            </label>
            <select
              value={formPedido.proveedor_id}
              onChange={(e) => setFormPedido({ ...formPedido, proveedor_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              required
            >
              <option value="">Selecciona un proveedor</option>
              {proveedores.map(prov => (
                <option key={prov.id} value={prov.id}>{prov.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={formPedido.descripcion}
              onChange={(e) => setFormPedido({ ...formPedido, descripcion: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              rows="2"
              placeholder="Ej: Pedido de materiales para enero..."
            />
          </div>

          {/* Sección para agregar productos */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">1</span>
              Agregar Productos
            </h4>

            <div className="space-y-4">
              <ProductoSearch
                productos={productos}
                onProductoSelect={seleccionarProducto}
              />

              {productoSeleccionado && (
                <div className="bg-white border border-indigo-100 p-4 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h5 className="font-bold text-slate-800">{productoSeleccionado.nombre}</h5>
                      <p className="text-xs text-slate-500 font-medium">Stock disponible: {productoSeleccionado.stock}</p>
                    </div>
                    <button
                      onClick={() => setProductoSeleccionado(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <IoClose size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad *</label>
                      <input
                        type="number"
                        value={cantidadProducto}
                        onChange={(e) => setCantidadProducto(e.target.value)}
                        min="1"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Unitario ($) *</label>
                      <input
                        type="number"
                        value={precioProducto}
                        onChange={(e) => setPrecioProducto(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={agregarProductoAlPedido}
                        className="w-full py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de productos agregados */}
              {formPedido.productos.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h5 className="font-bold text-slate-700 text-sm">
                      Productos agregados ({formPedido.productos.length})
                    </h5>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {formPedido.productos.map((prod, index) => (
                      <div key={index} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{prod.nombre}</div>
                          <div className="text-xs text-slate-500">
                            {prod.cantidad} × ${prod.precio_unitario.toLocaleString("es-CO")}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-600 text-sm">
                            ${prod.subtotal.toLocaleString("es-CO")}
                          </span>
                          <button
                            onClick={() => quitarProductoDelPedido(index)}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <IoClose size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-700">Total:</span>
                    <span className="font-black text-lg text-indigo-600">
                      ${formPedido.total.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Fecha estimada de entrega (opcional)
            </label>
            <input
              type="date"
              value={formPedido.fecha_entrega}
              onChange={(e) => setFormPedido({ ...formPedido, fecha_entrega: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setModalPedido(false);
                resetFormPedido();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardarPedido}
              disabled={!formPedido.proveedor_id || formPedido.productos.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 transition-all"
            >
              Guardar Pedido
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Nuevo Proveedor */}
      <Modal
        isOpen={modalProveedor}
        onClose={() => {
          setModalProveedor(false);
          resetFormProveedor();
        }}
        title="Nuevo Proveedor"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Nombre del Proveedor *
            </label>
            <input
              type="text"
              placeholder="Ej: Distribuidora ABC S.A."
              value={formProveedor.nombre}
              onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Persona de Contacto
              </label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={formProveedor.contacto}
                onChange={(e) => setFormProveedor({ ...formProveedor, contacto: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                placeholder="Ej: 3001234567"
                value={formProveedor.telefono}
                onChange={(e) => setFormProveedor({ ...formProveedor, telefono: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Ej: contacto@proveedor.com"
              value={formProveedor.email}
              onChange={(e) => setFormProveedor({ ...formProveedor, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Dirección
            </label>
            <textarea
              placeholder="Dirección completa del proveedor"
              value={formProveedor.direccion}
              onChange={(e) => setFormProveedor({ ...formProveedor, direccion: e.target.value })}
              className="w-full p-3 border bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Productos que suministra
            </label>
            <textarea
              placeholder="Lista de productos o servicios que provee"
              value={formProveedor.productos_sum}
              onChange={(e) => setFormProveedor({ ...formProveedor, productos_sum: e.target.value })}
              className="w-full p-3 border rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              rows="3"
            />
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-slate-200">
            <button
              onClick={() => {
                setModalProveedor(false);
                resetFormProveedor();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardarProveedor}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 transition-all"
            >
              Guardar Proveedor
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};