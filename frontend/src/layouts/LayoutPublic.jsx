// src/layouts/LayoutPublic.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import BannerTiendaCerrada from "../components/BannerTiendaCerrada";

export default function LayoutPublic() {
  return (
    <BannerTiendaCerrada>
      <Navbar />
      <div className="pt-16">
        <Outlet />
      </div>
    </BannerTiendaCerrada>
  );
}