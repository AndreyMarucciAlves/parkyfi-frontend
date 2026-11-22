import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../services/api';
import { tipoVeiculoService } from '../services/estacionamento';
import './CadastroTipoVeiculo.css';

export default function CadastroTipoVeiculo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [descricao, setDescricao] = useState('');
  const [valorHora, setValorHora] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit || !id) return;

    const carregarTipo = async () => {
      setLoading(true);
      setError('');
      try {
        const dados = await tipoVeiculoService.buscarPorId(Number(id));
        setDescricao(dados.descricao);
        setValorHora(String(dados.valorHora));
      } catch (err) {
        setError(getApiErrorMessage(err, 'Erro ao carregar tipo de veículo.'));
      } finally {
        setLoading(false);
      }
    };

    carregarTipo();
  }, [isEdit, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const descricaoLimpa = descricao.trim();
    const valorNumerico = Number(valorHora);

    if (!descricaoLimpa) {
      setError('Informe a descrição do tipo de veículo.');
      return;
    }

    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      setError('Informe um valor por hora maior que zero.');
      return;
    }

    setSaving(true);
    try {
      await tipoVeiculoService.salvar({
        id: isEdit && id ? Number(id) : undefined,
        descricao: descricaoLimpa,
        valorHora: valorNumerico,
      });
      navigate('/?tab=tipos', {
        state: {
          toast: isEdit
            ? 'Tipo de veículo atualizado com sucesso.'
            : 'Tipo de veículo cadastrado com sucesso.',
        },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erro ao salvar tipo de veículo.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cadastro-container">
        <div className="cadastro-card">Carregando dados da categoria...</div>
      </div>
    );
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <div className="cadastro-header">
          <Link to="/?tab=tipos" className="btn-voltar">
            ← Voltar
          </Link>
          <div className="cadastro-header-text">
            <h1>{isEdit ? 'Editar Tipo de Veículo' : 'Novo Tipo de Veículo'}</h1>
            <p>Defina a categoria e a tarifa cobrada por hora</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label htmlFor="descricao">
              Descrição <span className="required">*</span>
            </label>
            <input
              id="descricao"
              type="text"
              placeholder="Ex.: Carro Passeio, Motocicleta, Utilitário"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="valorHora">
              Valor por Hora (R$) <span className="required">*</span>
            </label>
            <div className="currency-input-wrapper">
              <span className="currency-prefix">R$</span>
              <input
                id="valorHora"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="10.00"
                value={valorHora}
                onChange={(e) => setValorHora(e.target.value)}
                required
              />
            </div>
            <span className="form-hint">
              O sistema calcula automaticamente o valor proporcional pelos minutos estacionados.
            </span>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancelar"
              onClick={() => navigate('/?tab=tipos')}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-salvar" disabled={saving}>
              {saving ? 'Salvando...' : isEdit ? 'Atualizar Categoria' : 'Cadastrar Categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
