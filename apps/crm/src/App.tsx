import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./components/Login";
import { useAuth } from "./lib/auth";
import Funil from "./routes/Funil";
import LeadDetail from "./routes/LeadDetail";
import Dashboard from "./routes/Dashboard";
import Empreendimentos from "./routes/Empreendimentos";
import Leads from "./routes/Leads";
import Config from "./routes/Config";
import Integracoes from "./routes/Integracoes";
import Hoje from "./routes/Hoje";

export default function App() {
  const { authed, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center text-ink-faint text-sm">Carregando…</div>;
  if (!authed) return <Login />;

  return (
    <AppShell>
      <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        <Route path="/" element={<Navigate to="/funil" replace />} />
        <Route path="/funil" element={<Funil />} />
        <Route path="/hoje" element={<Hoje />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/empreendimentos" element={<Empreendimentos />} />
        <Route path="/integracoes" element={<Integracoes />} />
        <Route path="/config" element={<Config />} />
        <Route path="*" element={<Navigate to="/funil" replace />} />
      </Routes>
      </ErrorBoundary>
    </AppShell>
  );
}
