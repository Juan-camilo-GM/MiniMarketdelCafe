import { Outlet } from "react-router-dom";
import SidebarAdmin from "../components/admin/SidebarAdmin";
import OfflineSync from "../components/admin/OfflineSync";

export default function LayoutAdmin() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarAdmin />
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen transition-all duration-300">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
      <OfflineSync />
    </div>
  );
}