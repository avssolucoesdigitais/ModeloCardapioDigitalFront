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
import GerenciadorMesas from "./pages/GerenciadorMesas";
import CrmAdmin from "./pages/CrmAdmin";
import LandingPage from "./pages/LandingPage";
import PDVAdmin from "./pages/PDVadmin";

// ── Wrappers ──────────────────────────────────
function LojaConfigAdminWrapper() {
  const { lojaSlug } = useParams();
  return <LojaConfigAdmin lojaId={lojaSlug} />;
}

function GerenciadorPaineisWrapper() {
  const { lojaSlug } = useParams();
  return <GerenciadorPaineis lojaId={lojaSlug} />;
}

function GerenciadorMesasWrapper() {
  const { lojaSlug } = useParams();
  return <GerenciadorMesas lojaId={lojaSlug} />;
}

function CrmAdminWrapper() {
  const { lojaSlug } = useParams();
  return <CrmAdmin lojaId={lojaSlug} />;
}

function PDVAdminWrapper() {
  return <PDVAdmin />;
}

function AdminProtected() {
  const { lojaSlug } = useParams();
  return (
    <ProtectedRoute lojaSlug={lojaSlug}>
      <AdminLayout />
    </ProtectedRoute>
  );
}

// ── App ───────────────────────────────────────
function App() {
  return (
    <Router>
      <Toaster />
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
        <Route path="/:lojaSlug/admin/lacartapdv" element={<PDVAdminWrapper />} />

        <Route path="/:lojaSlug/admin" element={<AdminProtected />}>
          <Route index element={<Navigate to="pedidos" replace />} />
          <Route path="pedidos"     element={<OrdersAdmin />} />
          <Route path="produtos"    element={<OpcoesCategoriaAdmin />} />
          <Route path="config"      element={<LojaConfigAdminWrapper />} />
          <Route path="paineis"     element={<GerenciadorPaineisWrapper />} />
          <Route path="crm"         element={<CrmAdminWrapper />} />
          <Route path="mesas"       element={<GerenciadorMesasWrapper />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;