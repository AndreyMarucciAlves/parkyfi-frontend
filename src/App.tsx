import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CadastroUsuario from './pages/CadastroUsuario';
import Dashboard from './pages/Dashboard';
import CadastroCliente from './pages/CadastroCliente';
import CadastroVeiculo from './pages/CadastroVeiculo';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<CadastroUsuario />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/cadastro-cliente" element={<CadastroCliente />} />
        <Route path="/cadastro-cliente/:id" element={<CadastroCliente />} />
        <Route path="/cadastro-veiculo" element={<CadastroVeiculo />} />
        <Route path="/cadastro-veiculo/:id" element={<CadastroVeiculo />} />
      </Routes>
    </BrowserRouter>
  );
}
