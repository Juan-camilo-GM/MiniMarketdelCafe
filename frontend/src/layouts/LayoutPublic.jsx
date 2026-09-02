// src/layouts/LayoutPublic.jsx
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import BannerTiendaCerrada from "../components/BannerTiendaCerrada";
import Footer from "../components/Footer";

const RUTAS_SIN_NAVBAR = [
  "/terminos-y-condiciones",
  "/politica-de-privacidad",
  "/politica-de-devoluciones",
];

export default function LayoutPublic() {
  const { pathname } = useLocation();
  const esRutaSinNavbar = RUTAS_SIN_NAVBAR.includes(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <BannerTiendaCerrada>
      {!esRutaSinNavbar && <Navbar />}
      <div className={`${esRutaSinNavbar ? "" : "pt-32 md:pt-24"} pb-12 w-full min-h-[calc(100vh-300px)]`}>
        <Outlet />
      </div>
      <Footer />
    </BannerTiendaCerrada>
  );
}