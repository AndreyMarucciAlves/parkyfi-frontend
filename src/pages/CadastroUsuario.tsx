import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import type { RegisterRequest } from '../types/auth';
import './CadastroUsuario.css';

export default function CadastroUsuario() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState<RegisterRequest>({
    nome: '',
    email: '',
    senha: '',
    cpf: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Cadastra o usuário
      await authService.register(form);

      // 2. Faz login automático com a conta recém-criada
      await login({ email: form.email, password: form.senha });

      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.status === 409) {
        setError(
          err.response.data?.message ||
          'E-mail ou CPF já cadastrado. Tente outro.'
        );
        return;
      }
      setError('Erro ao cadastrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <div className="cadastro-header">
          <h1>Parkfy</h1>
          <p>Crie sua conta para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label htmlFor="nome">Nome de Usuário <span>*</span></label>
            <input
              type="text"
              name="nome"
              id="nome"
              placeholder="João Silva"
              value={form.nome}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail <span>*</span></label>
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
            <label htmlFor="senha">Senha <span>*</span></label>
            <input
              type="password"
              name="senha"
              id="senha"
              placeholder="••••••••"
              value={form.senha}
              onChange={handleChange}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cpf">CPF <span>*</span></label>
            <input
              type="text"
              name="cpf"
              id="cpf"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={handleChange}
              required
              maxLength={14}
              autoComplete="off"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="cadastro-button"
            disabled={isLoading}
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar conta'}
          </button>
        </form>

        <div className="cadastro-footer">
          <p>Já tem uma conta? <a href="/login">Faça login</a></p>
        </div>
      </div>
    </div>
  );
}
