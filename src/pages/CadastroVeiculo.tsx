import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../services/api';
import { tipoVeiculoService, veiculoService } from '../services/estacionamento';
import type { TipoVeiculo } from '../types/estacionamento';
import './CadastroVeiculo.css';

export default function CadastroVeiculo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [idTipoVeiculo, setIdTipoVeiculo] = useState('');
  const [tiposVeiculo, setTiposVeiculo] = useState<TipoVeiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const carregarFormulario = async () => {
      setLoading(true);
      setError('');
      try {
        const tipos = await tipoVeiculoService.listarOpcoes();
        setTiposVeiculo(tipos);

        if (isEdit && id) {
          const veiculo = await veiculoService.buscarPorId(Number(id));
          setPlaca(veiculo.placa);
          setModelo(veiculo.modelo ?? '');
          setCor(veiculo.cor ?? '');
          setIdTipoVeiculo(String(veiculo.idTipoVeiculo));
        } else if (tipos[0]?.id) {
          setIdTipoVeiculo(String(tipos[0].id));
        }
      } catch (err) {
        setError(getApiErrorMessage(err, 'Erro ao carregar dados do veículo.'));
      } finally {
        setLoading(false);
      }
    };

    carregarFormulario();
  }, [isEdit, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const placaNormalizada = placa.trim();
    if (!placaNormalizada) {
      setError('A placa do veículo é obrigatória.');
      return;
    }

    if (!idTipoVeiculo) {
      setError('Selecione um tipo de veículo.');
      return;
    }

    setSaving(true);
    try {
      await veiculoService.salvar({
        id: isEdit && id ? Number(id) : undefined,
        placa: placaNormalizada,
        modelo: modelo.trim() || null,
        cor: cor.trim() || null,
        idTipoVeiculo: Number(idTipoVeiculo),
      });
      navigate('/?tab=veiculos', {
        state: {
          toast: isEdit
            ? 'Veículo atualizado com sucesso.'
            : 'Veículo cadastrado com sucesso.',
        },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erro ao salvar veículo.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cadastro-container">
        <div className="cadastro-card">Carregando informações do veículo...</div>
      </div>
    );
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <div className="cadastro-header">
          <Link to="/?tab=veiculos" className="btn-voltar">
            ← Voltar
          </Link>
          <div className="cadastro-header-text">
            <h1>{isEdit ? 'Editar Veículo' : 'Cadastrar Veículo'}</h1>
            <p>Vincule a placa do veículo a uma categoria tarifária</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {tiposVeiculo.length === 0 && (
          <div className="alert alert-warning">
            Nenhum tipo de veículo cadastrado.{' '}
            <Link to="/cadastro-tipo-veiculo" className="inline-link">
              Cadastre uma categoria primeiro
            </Link>
            .
          </div>
        )}

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label htmlFor="placa">
              Placa <span className="required">*</span>
            </label>
            <input
              id="placa"
              type="text"
              className="input-placa"
              placeholder="ABC1D23 ou ABC-1234"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              maxLength={10}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="modelo">Modelo</label>
              <input
                id="modelo"
                type="text"
                placeholder="Ex.: Civic, Onix, CG 160"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cor">Cor</label>
              <input
                id="cor"
                type="text"
                placeholder="Ex.: Prata, Preto"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="idTipoVeiculo">
              Tipo de Veículo <span className="required">*</span>
            </label>
            <select
              id="idTipoVeiculo"
              value={idTipoVeiculo}
              onChange={(e) => setIdTipoVeiculo(e.target.value)}
              required
              disabled={tiposVeiculo.length === 0}
            >
              <option value="">Selecione uma categoria</option>
              {tiposVeiculo.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.descricao} — R$ {Number(tipo.valorHora).toFixed(2).replace('.', ',')}/h
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancelar"
              onClick={() => navigate('/?tab=veiculos')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-salvar"
              disabled={saving || tiposVeiculo.length === 0}
            >
              {saving ? 'Salvando...' : isEdit ? 'Atualizar Veículo' : 'Cadastrar Veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
