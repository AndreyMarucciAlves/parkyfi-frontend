import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clienteService, veiculoService } from '../services/estacionamento';
import type { Cliente, Veiculo } from '../types/estacionamento';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'clientes' | 'veiculos'>('clientes');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [c, v] = await Promise.all([
        clienteService.listar(),
        veiculoService.listar(),
      ]);
      setClientes(c);
      setVeiculos(v);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
  }
  };

  const veiculosNoEstacionamento = veiculos.filter((v) => !v.saida);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand">
          <span className="logo-text">Parkfy</span>
          <span className="subtitle">Sistema de Gerenciamento de Estacionamento</span>
        </div>
        <div className="user-actions">
          <span className="user-info">
            Bem-vindo, {user?.name}
          </span>
          <button className="logout-button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-tabs">
          <button
            className={activeTab === 'clientes' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('clientes')}
          >
            👥 Clientes ({clientes.length})
          </button>
          <button
            className={activeTab === 'veiculos' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('veiculos')}
          >
            🚗 Veículos ({veiculos.length})
          </button>
        </div>

        {activeTab === 'clientes' ? (
          <ClientesSection
            clientes={clientes}
            carregarDados={carregarDados}
            loading={loading}
          />
        ) : (
          <VeiculosSection
            veiculos={veiculos}
            veiculosNoEstacionamento={veiculosNoEstacionamento}
            carregarDados={carregarDados}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}

function ClientesSection({
  clientes,
  carregarDados,
  loading,
}: {
  clientes: Cliente[];
  carregarDados: () => void;
  loading: boolean;
}) {
  return (
    <section className="section-clientes">
      <div className="section-header">
        <h2>Cadastro de Clientes</h2>
        <Link to="/cadastro-cliente" className="btn-primary">
          + Novo Cliente
        </Link>
      </div>

      {loading && <div className="loading">Carregando...</div>}

      {!loading && clientes.length === 0 && (
        <div className="empty-state">Nenhum cliente cadastrado.</div>
      )}

      {!loading && clientes.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Criado em</th>
              <th className="actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.nome}</td>
                <td>{cliente.email}</td>
                <td>{cliente.cpf}</td>
                <td>{cliente.telefone}</td>
                <td>{cliente.criadoEm ? new Date(cliente.criadoEm).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="actions">
                  <Link to={`/cadastro-cliente/${cliente.id}`} className="btn-edit">
                    Editar
                  </Link>
                  <button
                    className="btn-delete"
                    onClick={() => {
                      if (window.confirm('Deseja excluir este cliente?')) {
                        // TODO: implementar exclusão
                      }
                    }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function VeiculosSection({
  veiculos,
  veiculosNoEstacionamento,
  carregarDados,
  loading,
}: {
  veiculos: Veiculo[];
  veiculosNoEstacionamento: Veiculo[];
  carregarDados: () => void;
  loading: boolean;
}) {
  return (
    <section className="section-veiculos">
      <div className="section-header">
        <h2>Cadastro de Veículos</h2>
        <Link to="/cadastro-veiculo" className="btn-primary">
          + Novo Veículo
        </Link>
      </div>

      <div className="resumo-estacionamento">
        <div className="card-resumo">
          <h3>Total de Veículos</h3>
          <p>{veiculos.length}</p>
        </div>
        <div className="card-resumo">
          <h3>No Estacionamento</h3>
          <p>{veiculosNoEstacionamento.length}</p>
        </div>
        <div className="card-resumo">
          <h3>Já Saíram</h3>
          <p>{veiculos.length - veiculosNoEstacionamento.length}</p>
        </div>
      </div>

      {loading && <div className="loading">Carregando...</div>}

      {!loading && veiculos.length === 0 && (
        <div className="empty-state">Nenhum veículo cadastrado.</div>
      )}

      {!loading && veiculos.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Cor</th>
              <th>Cliente ID</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>Status</th>
              <th className="actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {veiculos.map((veiculo) => (
              <tr key={veiculo.id} className={veiculo.saida ? 'veiculo-saido' : ''}>
                <td>{veiculo.placa}</td>
                <td>{veiculo.modelo}</td>
                <td>{veiculo.cor}</td>
                <td>{veiculo.clienteId}</td>
                <td>{veiculo.entrada ? new Date(veiculo.entrada).toLocaleString('pt-BR') : '-'}</td>
                <td>{veiculo.saida ? new Date(veiculo.saida).toLocaleString('pt-BR') : '-'}</td>
                <td>
                  <span
                    className={`status-badge ${veiculo.saida ? 'saida' : 'no-estacionamento'}`}
                  >
                    {veiculo.saida ? 'Saído' : 'No estacionamento'}
                  </span>
                </td>
                <td className="actions">
                  {!veiculo.saida ? (
                    <>
                      <button
                        className="btn-saida"
                        onClick={() => {
                          if (window.confirm('Confirmar saída do veículo?')) {
                            // TODO: implementar saída via API
                          }
                        }}
                      >
                        Registrar Saída
                      </button>
                      <Link to={`/cadastro-veiculo/${veiculo.id}`} className="btn-edit">
                        Editar
                      </Link>
                    </>
                  ) : (
                    <Link to={`/cadastro-veiculo/${veiculo.id}`} className="btn-edit">
                      Editar
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
