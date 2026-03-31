import { createContext, useContext, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Cardapio from "./pages/Cardapio";
import Login from "./pages/Login";
import OpcoesCategoriaAdmin from "./pages/OpcoesCategoriaAdmin";
import OrdersAdmin from "./pages/OrdersAdmin";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import LojaConfigAdmin from "./pages/LojaConfigAdmin";
import AdminLayout from "./components/adminLayout";
import SuperAdmin from "./pages/SuperAdmin";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import GerenciadorPaineis from "./pages/GerenciadorPaineis";
import CrmAdmin from "./pages/CrmAdmin";
import LandingPage from "./pages/LandingPage";

export const CartOpenContext = createContext([false, () => {}]);

function ToasterWithPosition() {
  const [cartOpen] = useContext(CartOpenContext);
  return (
    <Toaster containerStyle={{ bottom: cartOpen ? 90 : 0, transition: "bottom 0.3s ease" }} />
  );
}

function LojaConfigAdminWrapper() {
  const { lojaSlug } = useParams();
  return <LojaConfigAdmin lojaId={lojaSlug} />;
}

function GerenciadorPaineisWrapper() {
  const { lojaSlug } = useParams();
  return <GerenciadorPaineis lojaId={lojaSlug} />;
}

function CrmAdminWrapper() {
  const { lojaSlug } = useParams();
  return <CrmAdmin lojaId={lojaSlug} />;
}

// Wrapper que lê o lojaSlug e passa pro ProtectedRoute como prop
function AdminProtected() {
  const { lojaSlug } = useParams();
  return (
    <ProtectedRoute lojaSlug={lojaSlug}>
      <AdminLayout />
    </ProtectedRoute>
  );
}

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <CartOpenContext.Provider value={[cartOpen, setCartOpen]}>
      <Router>
        <ToasterWithPosition />
        <Routes>

          <Route path="/" element={<LandingPage />} />

          <Route path="/login"           element={<Navigate to="/" replace />} />
          <Route path="/admin"           element={<Navigate to="/" replace />} />
          <Route path="/admin/pedidos"   element={<Navigate to="/" replace />} />
          <Route path="/admin/produtos"  element={<Navigate to="/" replace />} />
          <Route path="/admin/config"    element={<Navigate to="/" replace />} />

          <Route path="/superadmin/login" element={<SuperAdminLogin />} />
          <Route path="/superadmin" element={
            <SuperAdminRoute><SuperAdmin /></SuperAdminRoute>
          } />

          <Route path="/:lojaSlug" element={<Cardapio />} />
          <Route path="/:lojaSlug/login" element={<Login />} />

          <Route path="/:lojaSlug/admin" element={<AdminProtected />}>
            <Route index element={<Navigate to="pedidos" replace />} />
            <Route path="pedidos"   element={<OrdersAdmin />} />
            <Route path="produtos"  element={<OpcoesCategoriaAdmin />} />
            <Route path="config"    element={<LojaConfigAdminWrapper />} />
            <Route path="paineis"   element={<GerenciadorPaineisWrapper />} />
            <Route path="crm"       element={<CrmAdminWrapper />} />
          </Route>

        </Routes>
      </Router>
    </CartOpenContext.Provider>
  );
}

export default App;
