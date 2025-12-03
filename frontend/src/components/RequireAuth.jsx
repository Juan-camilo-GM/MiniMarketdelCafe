import { Navigate } from "react-router-dom";
import SessionLoader from "./SessionLoader";
import { useAuth } from "../context/AuthContext";

function RequireAuth({ children }) {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return <SessionLoader message="Verificando permisos de administrador..." />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export default RequireAuth;