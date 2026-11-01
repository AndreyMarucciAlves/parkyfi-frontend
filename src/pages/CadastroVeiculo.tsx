import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { veiculoService, clienteService } from '../services/estacionamento';
import type { Veiculo, VeiculoRequest, Cliente } from '../types/estacionamento';
import './CadastroVeiculo.css';

export default function CadastroVeiculo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [veiculo, setVeiculo] = useState<VeiculoRequest>({
    placa: '',
    modelo: '',
    cor: '',
    clienteId: 0,
  });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEdit = !!id;

  useEffect(() => {
    carregarClientes();
    if (isEdit && id) {
      carregarVeiculo(Number(id));
    }
  }, [isEdit, id]);

  const carregarClientes = async () => {
    try {
      const c = await clienteService.listar();
      setClientes(c);
    } catch (err) {
      setError('Erro ao carregar lista de clientes.');
    }
  };

  const carregarVeiculo = async (id: number) => {
    setLoading(true);
    try {
      const v = await veiculoService.buscarPorId(Number(id));
      setVeiculo({
        placa: v.placa,
        modelo: v.modelo,
        cor: v.cor,
        clienteId: v.clienteId,
      });
    } catch (err) {
      setError('Erro ao carregar veículo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setVeiculo({ ...veiculo, [name]: name === 'clienteId' ? Number(value) : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (isEdit && id) {
        await veiculoService.atualizar(Number(id), veiculo);
        setSuccess('Veículo atualizado com sucesso!');
      } else {
        await veiculoService.criar(veiculo);
        setSuccess('Veículo cadastrado com sucesso!');
      }
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar veículo.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaida = async () => {
    if (!id) return;
    if (!window.confirm('Confirmar saída do veículo?')) return;
    try {
      await veiculoService.registrarSaida(Number(id));
      setSuccess('Saída registrada com sucesso!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar saída.');
    }
  };

  if (loading) {
    return (
      <div className="cadastro-container">
        <div className="cadastro-card">Carregando veículo...</div>
      </div>
    );
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <div className="cadastro-header">
          <Link to="/" className="btn-voltar">← Voltar</Link>
          <h1>{isEdit ? 'Editar Veículo' : 'Cadastrar Veículo'}</h1>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label htmlFor="placa">Placa <span>*</span></label>
            <input
              type="text"
              name="placa"
              id="placa"
              placeholder="ABC-1234"
              value={veiculo.placa}
              onChange={handleChange}
              required
              maxLength={7}
            />
          </div>

          <div className="form-group">
            <label htmlFor="modelo">Modelo <span>*</span></label>
            <input
              type="text"
              name="modelo"
              id="modelo"
              placeholder="Fusca"
              value={veiculo.modelo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cor">Cor <span>*</span></label>
            <input
              type="text"
              name="cor"
              id="cor"
              placeholder="Preto"
              value={veiculo.cor}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="clienteId">Cliente <span>*</span></label>
            <select name="clienteId" id="clienteId" value={veiculo.clienteId} onChange={handleChange} required>
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.cpf})
                </option>
              ))}
            </select>
          </div>

          {isEdit && id && (
            <div className="form-group saida-group">
              <button
                type="button"
                className="btn-saida"
                onClick={handleSaida}
              >
                Registrar Saída do Veículo
              </button>
            </div>
          )}

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
