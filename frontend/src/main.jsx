import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./pages/admin/Admin";
import HistorialPedidos from "./pages/admin/HistorialPedidos";
import RegistrarVenta from "./pages/admin/RegistrarVenta";
import Catalogo from "./pages/public/Catalogo";
import AdminLogin from "./pages/admin/AdminLogin";
import RequireAuth from "./components/RequireAuth";
import LayoutAdmin from "./layouts/LayoutAdmin";
import LayoutPublic from "./layouts/LayoutPublic";
import { Toaster } from "react-hot-toast";

// ← NUEVAS IMPORTACIONES (solo estas dos)
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import { IoCheckmarkCircle } from "react-icons/io5";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            icon: <IoCheckmarkCircle className="text-emerald-500 text-xl" />,
            style: {
              fontWeight: '500',
            },
          },
        }}
      />
      <Routes>
        {/* Layout público */}
        <Route element={<LayoutPublic />}>
          <Route path="/" element={<Catalogo />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Route>

        {/* Layout admin protegido */}
        <Route
          element={
            <RequireAuth>
              <LayoutAdmin />
            </RequireAuth>
          }
        >
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/historial" element={<HistorialPedidos />} />
          <Route path="/admin/venta" element={<RegistrarVenta />} />
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);