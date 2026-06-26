import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
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
  const { authed } = useAuth();
  if (!authed) return <Login />;

  return (
    <AppShell>
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
    </AppShell>
  );
}
