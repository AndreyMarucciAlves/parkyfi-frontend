import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CadastroTipoVeiculo from './pages/CadastroTipoVeiculo';
import CadastroVeiculo from './pages/CadastroVeiculo';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cadastro-veiculo" element={<CadastroVeiculo />} />
        <Route path="/cadastro-veiculo/:id" element={<CadastroVeiculo />} />
        <Route path="/cadastro-tipo-veiculo" element={<CadastroTipoVeiculo />} />
        <Route path="/cadastro-tipo-veiculo/:id" element={<CadastroTipoVeiculo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
