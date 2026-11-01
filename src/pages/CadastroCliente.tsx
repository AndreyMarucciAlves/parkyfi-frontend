import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { clienteService } from '../services/estacionamento';
import type { Cliente, ClienteRequest } from '../types/estacionamento';
import './CadastroCliente.css';

export default function CadastroCliente() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [cliente, setCliente] = useState<ClienteRequest>({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit && id) {
      carregarCliente(Number(id));
    }
  }, [isEdit, id]);

  const carregarCliente = async (id: number) => {
    setLoading(true);
    try {
      const c = await clienteService.buscarPorId(Number(id));
      setCliente({
        nome: c.nome,
        email: c.email,
        cpf: c.cpf,
        telefone: c.telefone,
      });
    } catch (err) {
      setError('Erro ao carregar cliente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCliente({ ...cliente, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (isEdit && id) {
        await clienteService.atualizar(Number(id), cliente);
        setSuccess('Cliente atualizado com sucesso!');
      } else {
        await clienteService.criar(cliente);
        setSuccess('Cliente cadastrado com sucesso!');
      }
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar cliente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cadastro-container">
        <div className="cadastro-card">Carregando cliente...</div>
      </div>
    );
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <div className="cadastro-header">
          <Link to="/" className="btn-voltar">← Voltar</Link>
          <h1>{isEdit ? 'Editar Cliente' : 'Cadastrar Cliente'}</h1>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label htmlFor="nome">Nome Completo <span>*</span></label>
            <input
              type="text"
              name="nome"
              id="nome"
              placeholder="João Silva"
              value={cliente.nome}
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
              placeholder="joao@email.com"
              value={cliente.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cpf">CPF <span>*</span></label>
              <input
                type="text"
                name="cpf"
                id="cpf"
                placeholder="000.000.000-00"
                value={cliente.cpf}
                onChange={handleChange}
                required
                maxLength={14}
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefone">Telefone <span>*</span></label>
              <input
                type="tel"
                name="telefone"
                id="telefone"
                placeholder="(11) 99999-9999"
                value={cliente.telefone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={() => navigate('/')}>
              Cancelar
            </button>
            <button type="submit" className="btn-salvar" disabled={saving}>
              {saving ? 'Salvando...' : isEdit ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
