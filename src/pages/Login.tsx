import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { LoginRequest } from '../types/auth';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [form, setForm] = useState<LoginRequest>({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/');
    } catch (err: any) {
      if (!err.response) {
        setError(
          'Não foi possível conectar ao backend. Verifique se o servidor está rodando em http://localhost:8080'
        );
        return;
      }
      if (err.response.status === 401 || err.response.status === 400) {
        setError('E-mail ou senha inválidos. Tente novamente.');
        return;
      }
      setError('Erro inesperado. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Parkfy</h1>
          <p>Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p>Não tem uma conta? <a href="/cadastro">Cadastre-se</a></p>
        </div>
      </div>
    </div>
  );
}
