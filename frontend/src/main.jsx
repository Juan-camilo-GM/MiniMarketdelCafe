import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./pages/admin/Admin";
import HistorialPedidos from "./pages/admin/HistorialPedidos";
import Catalogo from "./pages/public/Catalogo";
import AdminLogin from "./pages/admin/AdminLogin";
import RequireAuth from "./components/RequireAuth";
import LayoutAdmin from "./layouts/LayoutAdmin";
import LayoutPublic from "./layouts/LayoutPublic";
import { Toaster } from "react-hot-toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Toaster position="top-right" />

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
      </Route>
    </Routes>
  </BrowserRouter>
);
