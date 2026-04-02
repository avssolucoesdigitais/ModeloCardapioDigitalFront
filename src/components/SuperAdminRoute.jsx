import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const SUPER_ADMIN_UID = import.meta.env.VITE_SUPER_ADMIN_UID;

/**
 * SuperAdminRoute — protege a rota /superadmin.
 * Se não autenticado       → redireciona para /superadmin/login
 * Se autenticado mas não é superadmin → redireciona para /superadmin/login
 * Enquanto carrega → spinner
 */
export default function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user || user.uid !== SUPER_ADMIN_UID) {
    return <Navigate to="/superadmin/login" state={{ from: location }} replace />;
  }

  return children;
}
