import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CadastroCliente from './pages/CadastroCliente';
import CadastroVeiculo from './pages/CadastroVeiculo';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading">
        Carregando autenticação...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading">
        Carregando autenticação...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cadastro-cliente"
          element={
            <ProtectedRoute>
              <CadastroCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cadastro-cliente/:id"
          element={
            <ProtectedRoute>
              <CadastroCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cadastro-veiculo"
          element={
            <ProtectedRoute>
              <CadastroVeiculo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cadastro-veiculo/:id"
          element={
            <ProtectedRoute>
              <CadastroVeiculo />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
