// src/layouts/LayoutAdmin.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function LayoutAdmin() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-gray-50">
        <Outlet />
      </main>
    </>
  );
}