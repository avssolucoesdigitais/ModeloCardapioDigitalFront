import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Cardapio from "./pages/Cardapio";
import Login from "./pages/Login";
import ProductAdmin from "./pages/ProductsAdmin";
import OrdersAdmin from "./pages/OrdersAdmin";
import OrdersHistory from "./pages/OrdersHistory";
import ProtectedRoute from "./componets/ProtectedRoute";
import LojaConfigAdmin from "./pages/LojaConfigAdmin";
import AdminLayout from "./componets/adminLayout";

function App() {
  return (
    <Router>
      <Routes>
        {/* Público */}
        <Route path="/" element={<Cardapio />} />
        <Route path="/login" element={<Login />} />

        {/* Admin protegido */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Redireciona /admin para /admin/pedidos */}
          <Route index element={<Navigate to="pedidos" replace />} />
          <Route path="pedidos" element={<OrdersAdmin />} />
          <Route path="produtos" element={<ProductAdmin />} />
          <Route path="historico" element={<OrdersHistory />} />
          <Route path="config" element={<LojaConfigAdmin />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

