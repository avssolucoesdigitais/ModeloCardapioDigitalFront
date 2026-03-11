import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import Cardapio from "./pages/Cardapio";
import Login from "./pages/Login";
import OpcoesCategoriaAdmin from "./pages/OpcoesCategoriaAdmin";
import OrdersAdmin from "./pages/OrdersAdmin";
import OrdersHistory from "./pages/OrdersHistory";
import ProtectedRoute from "./components/ProtectedRoute";
import LojaConfigAdmin from "./pages/LojaConfigAdmin";
import AdminLayout from "./components/adminLayout";
import SuperAdmin from "./pages/SuperAdmin";

// Wrapper para injetar lojaSlug como lojaId no LojaConfigAdmin
function LojaConfigAdminWrapper() {
  const { lojaSlug } = useParams();
  return <LojaConfigAdmin lojaId={lojaSlug} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/" replace />} />

        <Route path="/superadmin" element={<SuperAdmin />} />

        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/admin/pedidos" element={<Navigate to="/" replace />} />
        <Route path="/admin/produtos" element={<Navigate to="/" replace />} />
        <Route path="/admin/historico" element={<Navigate to="/" replace />} />
        <Route path="/admin/config" element={<Navigate to="/" replace />} />

        <Route path="/:lojaSlug" element={<Cardapio />} />
        <Route path="/:lojaSlug/login" element={<Login />} />

        <Route path="/:lojaSlug/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="pedidos" replace />} />

          <Route path="pedidos" element={<ProtectedRoute><OrdersAdmin /></ProtectedRoute>} />
          <Route path="produtos" element={<ProtectedRoute><OpcoesCategoriaAdmin /></ProtectedRoute>} />
          <Route path="historico" element={<ProtectedRoute><OrdersHistory /></ProtectedRoute>} />
          <Route path="config" element={<ProtectedRoute><LojaConfigAdminWrapper /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;