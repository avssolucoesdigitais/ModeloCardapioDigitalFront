import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Cardapio from "./pages/Cardapio";
import Login from "./pages/Login";
import OpcoesCategoriaAdmin from "./pages/OpcoesCategoriaAdmin";
import OrdersAdmin from "./pages/OrdersAdmin";
import OrdersHistory from "./pages/OrdersHistory";
import ProtectedRoute from "./components/ProtectedRoute";
import LojaConfigAdmin from "./pages/LojaConfigAdmin";
import AdminLayout from "./components/adminLayout";

function App() {
  return (
    <Router>
      <Routes>
        {/* Público */}
        <Route path="/" element={<Cardapio />} />
        <Route path="/login" element={<Login />} />

        {/* Admin protegido */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Redireciona /admin → /admin/pedidos */}
          <Route index element={<Navigate to="pedidos" replace />} />

          <Route
            path="pedidos"
            element={
              <ProtectedRoute>
                <OrdersAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="produtos"
            element={
              <ProtectedRoute>
                <OpcoesCategoriaAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="historico"
            element={
              <ProtectedRoute>
                <OrdersHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="config"
            element={
              <ProtectedRoute>
                <LojaConfigAdmin />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
