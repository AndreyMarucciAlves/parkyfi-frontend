import { useNavigate } from 'react-router-dom';
import './Login.css';

// Tela de login apenas visual (demonstracao): nao ha autenticacao no sistema.
// O navegador valida o formato do e-mail (type="email" + required) e o envio leva ao painel.
export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
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
              required
              autoComplete="email"
            />
          </div>

          <button type="submit" className="login-button">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
