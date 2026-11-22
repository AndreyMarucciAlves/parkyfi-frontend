import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../services/api';
import {
  ticketService,
  tipoVeiculoService,
  veiculoService,
} from '../services/estacionamento';
import type {
  DadosTicketSaida,
  FilterPageable,
  ResponsePagedCommom,
  SortDirection,
  Ticket,
  TipoVeiculo,
  Veiculo,
} from '../types/estacionamento';
import './Dashboard.css';

type ActiveTab = 'tickets' | 'veiculos' | 'tipos';

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

interface DeleteTarget {
  kind: 'veiculo' | 'tipo';
  id: number;
  label: string;
}

const DEFAULT_PAGE_SIZE = 10;

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startIso: string, endIso?: string | null): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';

  const totalMinutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${String(minutes).padStart(2, '0')}min`;
}

function toInputDateTime(isoValue: string): string {
  if (!isoValue) return '';
  return isoValue.slice(0, 16);
}

function toApiLocalDateTime(inputValue: string): string {
  if (!inputValue) return '';
  return inputValue.length === 16 ? `${inputValue}:00` : inputValue;
}

function parseTab(value: string | null): ActiveTab {
  if (value === 'veiculos' || value === 'tipos' || value === 'tickets') {
    return value;
  }
  return 'tickets';
}

async function buscarDadosPainel(
  ticketsFilter: FilterPageable,
  veiculosFilter: FilterPageable,
  tiposFilter: FilterPageable
) {
  const [ticketsRes, veiculosRes, tiposRes, tiposRef, veiculosRef, ticketsRef] =
    await Promise.all([
      ticketService.listar(ticketsFilter),
      veiculoService.listar(veiculosFilter),
      tipoVeiculoService.listar(tiposFilter),
      tipoVeiculoService.listar({ page: 0, size: 100, direction: 'ASC', orderBy: 'descricao' }),
      veiculoService.listar({ page: 0, size: 500, direction: 'ASC', orderBy: 'placa' }),
      ticketService.listar({ page: 0, size: 500, direction: 'DESC', orderBy: 'id' }),
    ]);

  return {
    ticketsRes,
    veiculosRes,
    tiposRes,
    tiposRef,
    veiculosRef,
    ticketsRef,
  };
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const activeTab = parseTab(searchParams.get('tab'));

  const [nowClock, setNowClock] = useState(() => new Date());
  const [toast, setToast] = useState<ToastState | null>(() => {
    const state = location.state as { toast?: string } | null;
    return state?.toast ? { type: 'success', message: state.toast } : null;
  });
  const [connectionError, setConnectionError] = useState('');

  const [ticketsPage, setTicketsPage] = useState<ResponsePagedCommom<Ticket>>({
    data: [],
    totalRecords: 0,
    totalPages: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [ticketsFilter, setTicketsFilter] = useState<FilterPageable>({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    direction: 'DESC',
    orderBy: 'id',
  });
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'TODOS' | 'ABERTO' | 'FECHADO'>('TODOS');
  const [ticketSearch, setTicketSearch] = useState('');

  const [veiculosPage, setVeiculosPage] = useState<ResponsePagedCommom<Veiculo>>({
    data: [],
    totalRecords: 0,
    totalPages: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [veiculosFilter, setVeiculosFilter] = useState<FilterPageable>({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    direction: 'ASC',
    orderBy: 'placa',
  });

  const [tiposPage, setTiposPage] = useState<ResponsePagedCommom<TipoVeiculo>>({
    data: [],
    totalRecords: 0,
    totalPages: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [tiposFilter, setTiposFilter] = useState<FilterPageable>({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    direction: 'ASC',
    orderBy: 'descricao',
  });

  const [allTipos, setAllTipos] = useState<TipoVeiculo[]>([]);
  const [allVeiculos, setAllVeiculos] = useState<Veiculo[]>([]);
  const [allTicketsSummary, setAllTicketsSummary] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [entradaModalOpen, setEntradaModalOpen] = useState(false);
  const [entradaPlacaInicial, setEntradaPlacaInicial] = useState('');
  const [entradaTipoInicial, setEntradaTipoInicial] = useState<number | undefined>(undefined);

  const [checkoutData, setCheckoutData] = useState<DadosTicketSaida | null>(null);
  const [loadingCheckoutId, setLoadingCheckoutId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const aplicarDadosPainel = useCallback(
    (dados: Awaited<ReturnType<typeof buscarDadosPainel>>) => {
      setTicketsPage(dados.ticketsRes);
      setVeiculosPage(dados.veiculosRes);
      setTiposPage(dados.tiposRes);
      setAllTipos(dados.tiposRef.data);
      setAllVeiculos(dados.veiculosRef.data);
      setAllTicketsSummary(dados.ticketsRef.data);
      setConnectionError('');
    },
    []
  );

  const carregarTudo = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await buscarDadosPainel(ticketsFilter, veiculosFilter, tiposFilter);
      aplicarDadosPainel(dados);
    } catch (err) {
      setConnectionError(
        getApiErrorMessage(err, 'Erro ao carregar os dados do estacionamento.')
      );
    } finally {
      setLoading(false);
    }
  }, [ticketsFilter, veiculosFilter, tiposFilter, aplicarDadosPainel]);

  useEffect(() => {
    let cancelled = false;

    buscarDadosPainel(ticketsFilter, veiculosFilter, tiposFilter)
      .then((dados) => {
        if (!cancelled) {
          aplicarDadosPainel(dados);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setConnectionError(
            getApiErrorMessage(err, 'Erro ao carregar os dados do estacionamento.')
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticketsFilter, veiculosFilter, tiposFilter, aplicarDadosPainel]);

  const tiposById = useMemo(() => {
    const map = new Map<number, TipoVeiculo>();
    for (const tipo of allTipos) {
      if (tipo.id) map.set(tipo.id, tipo);
    }
    return map;
  }, [allTipos]);

  const activePlates = useMemo(() => {
    const set = new Set<string>();
    for (const ticket of allTicketsSummary) {
      if (ticket.status === 'ABERTO') {
        set.add(ticket.placa.toUpperCase());
      }
    }
    return set;
  }, [allTicketsSummary]);

  const kpis = useMemo(() => {
    let abertos = 0;
    let fechados = 0;
    let faturamento = 0;

    for (const ticket of allTicketsSummary) {
      if (ticket.status === 'ABERTO') {
        abertos += 1;
      } else {
        fechados += 1;
        faturamento += Number(ticket.valorTotal ?? 0);
      }
    }

    return {
      abertos,
      fechados,
      faturamento,
      totalVeiculos: veiculosPage.totalRecords,
      totalTipos: tiposPage.totalRecords,
    };
  }, [allTicketsSummary, veiculosPage.totalRecords, tiposPage.totalRecords]);

  const ticketsVisiveis = useMemo(() => {
    const termo = ticketSearch.trim().toUpperCase();
    return ticketsPage.data.filter((ticket) => {
      const matchesStatus =
        ticketStatusFilter === 'TODOS' || ticket.status === ticketStatusFilter;
      const matchesSearch = !termo || ticket.placa.toUpperCase().includes(termo);
      return matchesStatus && matchesSearch;
    });
  }, [ticketsPage.data, ticketStatusFilter, ticketSearch]);

  const setTab = (tab: ActiveTab) => {
    setSearchParams({ tab });
  };

  const abrirModalEntrada = (placa = '', tipoId?: number) => {
    setEntradaPlacaInicial(placa);
    setEntradaTipoInicial(tipoId);
    setEntradaModalOpen(true);
  };

  const abrirModalSaida = async (ticketId: number) => {
    setLoadingCheckoutId(ticketId);
    try {
      const dados = await ticketService.buscarDadosSaida(ticketId);
      setCheckoutData(dados);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Erro ao consultar dados de saída do ticket.'));
    } finally {
      setLoadingCheckoutId(null);
    }
  };

  const confirmarExclusao = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'veiculo') {
        await veiculoService.deletar(deleteTarget.id);
        showToast('success', 'Veículo excluído com sucesso.');
      } else {
        await tipoVeiculoService.deletar(deleteTarget.id);
        showToast('success', 'Tipo de veículo excluído com sucesso.');
      }
      setDeleteTarget(null);
      await carregarTudo();
    } catch (err) {
      showToast(
        'error',
        getApiErrorMessage(
          err,
          'Não foi possível excluir o registro. Verifique se ele possui vínculos ativos.'
        )
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              P
            </div>
            <div>
              <span className="brand-name">Parkyfi</span>
              <span className="brand-tagline">Operação de Estacionamento</span>
            </div>
          </div>

          <div className="topbar-actions">
            <span className="clock-pill" title="Horário local">
              {nowClock.toLocaleTimeString('pt-BR')}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={carregarTudo}
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => abrirModalEntrada()}
            >
              + Registrar Entrada
            </button>
          </div>
        </div>

        <nav className="tabs-bar" aria-label="Seções do sistema">
          <div className="tabs-bar-inner">
            <button
              type="button"
              className={`nav-tab ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => setTab('tickets')}
            >
              Tickets e Pátio
              <span className="tab-count">{kpis.abertos}</span>
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'veiculos' ? 'active' : ''}`}
              onClick={() => setTab('veiculos')}
            >
              Veículos
              <span className="tab-count">{kpis.totalVeiculos}</span>
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'tipos' ? 'active' : ''}`}
              onClick={() => setTab('tipos')}
            >
              Tipos e Tarifas
              <span className="tab-count">{kpis.totalTipos}</span>
            </button>
          </div>
        </nav>
      </header>

      <main className="dashboard-content">
        {toast && (
          <div className={`toast-banner ${toast.type}`} role="status">
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => setToast(null)}
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        )}

        {connectionError && (
          <div className="alert alert-error">
            <strong>Falha de comunicação com a API:</strong> {connectionError}
          </div>
        )}

        <section className="kpi-grid" aria-label="Resumo operacional">
          <article className="kpi-card">
            <span className="kpi-label">No Pátio Agora</span>
            <strong className="kpi-value text-emerald">{kpis.abertos}</strong>
            <span className="kpi-sub">Tickets em aberto</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-label">Saídas Concluídas</span>
            <strong className="kpi-value">{kpis.fechados}</strong>
            <span className="kpi-sub">Tickets fechados</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-label">Faturamento</span>
            <strong className="kpi-value mono">{formatCurrency(kpis.faturamento)}</strong>
            <span className="kpi-sub">Total em tickets fechados</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-label">Frota Cadastrada</span>
            <strong className="kpi-value">{kpis.totalVeiculos}</strong>
            <span className="kpi-sub">{kpis.totalTipos} categoria(s) de tarifa</span>
          </article>
        </section>

        {activeTab === 'tickets' && (
          <section className="panel-card">
            <div className="panel-header">
              <div>
                <h2>Controle de Tickets</h2>
                <p>Acompanhe entradas ativas, permanência e finalize saídas com cobrança</p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => abrirModalEntrada()}
              >
                + Nova Entrada
              </button>
            </div>

            <div className="toolbar">
              <div className="filter-pills">
                {(['TODOS', 'ABERTO', 'FECHADO'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`pill-btn ${ticketStatusFilter === status ? 'active' : ''}`}
                    onClick={() => setTicketStatusFilter(status)}
                  >
                    {status === 'TODOS'
                      ? 'Todos'
                      : status === 'ABERTO'
                        ? 'No pátio'
                        : 'Finalizados'}
                  </button>
                ))}
              </div>

              <div className="toolbar-controls">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Filtrar placa na página..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                />
                <SortControls
                  filter={ticketsFilter}
                  options={[
                    { value: 'id', label: 'Mais recentes' },
                    { value: 'dataEntrada', label: 'Data entrada' },
                    { value: 'dataSaida', label: 'Data saída' },
                    { value: 'valor', label: 'Valor' },
                    { value: 'status', label: 'Status' },
                  ]}
                  onChange={setTicketsFilter}
                />
              </div>
            </div>

            {loading ? (
              <div className="panel-state">Carregando tickets...</div>
            ) : ticketsVisiveis.length === 0 ? (
              <div className="panel-state">
                Nenhum ticket encontrado. Clique em <strong>+ Nova Entrada</strong> para iniciar.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Placa</th>
                      <th>Entrada</th>
                      <th>Saída</th>
                      <th>Permanência</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th className="col-actions">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsVisiveis.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className={ticket.status === 'FECHADO' ? 'row-closed' : ''}
                      >
                        <td className="mono">#{ticket.id}</td>
                        <td>
                          <span className="placa-badge">{ticket.placa}</span>
                        </td>
                        <td>{formatDateTime(ticket.dataEntrada)}</td>
                        <td>{formatDateTime(ticket.dataSaida)}</td>
                        <td className="mono">
                          {formatDuration(ticket.dataEntrada, ticket.dataSaida)}
                        </td>
                        <td className="mono font-semibold">
                          {ticket.status === 'FECHADO'
                            ? formatCurrency(ticket.valorTotal)
                            : 'Em aberto'}
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              ticket.status === 'ABERTO' ? 'open' : 'closed'
                            }`}
                          >
                            {ticket.status === 'ABERTO' ? 'No pátio' : 'Finalizado'}
                          </span>
                        </td>
                        <td className="col-actions">
                          {ticket.status === 'ABERTO' ? (
                            <button
                              type="button"
                              className="btn-checkout"
                              disabled={loadingCheckoutId === ticket.id}
                              onClick={() => abrirModalSaida(ticket.id)}
                            >
                              {loadingCheckoutId === ticket.id
                                ? 'Calculando...'
                                : 'Registrar Saída'}
                            </button>
                          ) : (
                            <span className="muted-done">Concluído</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <PaginationBar
              page={ticketsFilter.page}
              totalPages={ticketsPage.totalPages}
              totalRecords={ticketsPage.totalRecords}
              onPageChange={(nextPage) =>
                setTicketsFilter((prev) => ({ ...prev, page: nextPage }))
              }
            />
          </section>
        )}

        {activeTab === 'veiculos' && (
          <section className="panel-card">
            <div className="panel-header">
              <div>
                <h2>Veículos Cadastrados</h2>
                <p>Gerencie placas, modelos, cores e o vínculo com a tarifa de cada veículo</p>
              </div>
              <Link to="/cadastro-veiculo" className="btn-primary link-btn">
                + Novo Veículo
              </Link>
            </div>

            <div className="toolbar toolbar-end">
              <SortControls
                filter={veiculosFilter}
                options={[
                  { value: 'placa', label: 'Placa' },
                  { value: 'modelo', label: 'Modelo' },
                  { value: 'cor', label: 'Cor' },
                  { value: 'id', label: 'Cadastro' },
                ]}
                onChange={setVeiculosFilter}
              />
            </div>

            {loading ? (
              <div className="panel-state">Carregando veículos...</div>
            ) : veiculosPage.data.length === 0 ? (
              <div className="panel-state">
                Nenhum veículo cadastrado ainda. Cadastre um veículo ou registre uma entrada direta.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Placa</th>
                      <th>Modelo</th>
                      <th>Cor</th>
                      <th>Categoria / Tarifa</th>
                      <th className="col-actions">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {veiculosPage.data.map((veiculo) => {
                      const tipo = tiposById.get(veiculo.idTipoVeiculo);
                      const jaNoPatio = activePlates.has(veiculo.placa.toUpperCase());

                      return (
                        <tr key={veiculo.id}>
                          <td className="mono">#{veiculo.id}</td>
                          <td>
                            <span className="placa-badge">{veiculo.placa}</span>
                          </td>
                          <td>{veiculo.modelo || <span className="muted-text">Não informado</span>}</td>
                          <td>{veiculo.cor || <span className="muted-text">Não informada</span>}</td>
                          <td>
                            {tipo ? (
                              <span>
                                {tipo.descricao}{' '}
                                <span className="muted-text mono">
                                  ({formatCurrency(tipo.valorHora)}/h)
                                </span>
                              </span>
                            ) : (
                              `Categoria #${veiculo.idTipoVeiculo}`
                            )}
                          </td>
                          <td className="col-actions">
                            <div className="row-actions">
                              {jaNoPatio ? (
                                <span className="status-pill open">No pátio</span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-checkout"
                                  onClick={() =>
                                    abrirModalEntrada(veiculo.placa, veiculo.idTipoVeiculo)
                                  }
                                >
                                  Entrada
                                </button>
                              )}
                              <Link
                                to={`/cadastro-veiculo/${veiculo.id}`}
                                className="btn-action-edit"
                              >
                                Editar
                              </Link>
                              <button
                                type="button"
                                className="btn-action-delete"
                                onClick={() =>
                                  setDeleteTarget({
                                    kind: 'veiculo',
                                    id: veiculo.id!,
                                    label: `o veículo de placa ${veiculo.placa}`,
                                  })
                                }
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <PaginationBar
              page={veiculosFilter.page}
              totalPages={veiculosPage.totalPages}
              totalRecords={veiculosPage.totalRecords}
              onPageChange={(nextPage) =>
                setVeiculosFilter((prev) => ({ ...prev, page: nextPage }))
              }
            />
          </section>
        )}

        {activeTab === 'tipos' && (
          <section className="panel-card">
            <div className="panel-header">
              <div>
                <h2>Tipos de Veículo e Tarifas</h2>
                <p>Configure as categorias de veículos e o valor cobrado por hora</p>
              </div>
              <Link to="/cadastro-tipo-veiculo" className="btn-primary link-btn">
                + Novo Tipo
              </Link>
            </div>

            <div className="toolbar toolbar-end">
              <SortControls
                filter={tiposFilter}
                options={[
                  { value: 'descricao', label: 'Descrição' },
                  { value: 'valorHora', label: 'Valor por hora' },
                  { value: 'id', label: 'Cadastro' },
                ]}
                onChange={setTiposFilter}
              />
            </div>

            {loading ? (
              <div className="panel-state">Carregando tipos de veículo...</div>
            ) : tiposPage.data.length === 0 ? (
              <div className="panel-state">
                Nenhum tipo de veículo cadastrado. Crie categorias como Carro, Moto ou Utilitário.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Descrição</th>
                      <th>Valor por Hora</th>
                      <th className="col-actions">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiposPage.data.map((tipo) => (
                      <tr key={tipo.id}>
                        <td className="mono">#{tipo.id}</td>
                        <td className="font-semibold">{tipo.descricao}</td>
                        <td className="mono font-semibold text-emerald">
                          {formatCurrency(tipo.valorHora)}/h
                        </td>
                        <td className="col-actions">
                          <div className="row-actions">
                            <Link
                              to={`/cadastro-tipo-veiculo/${tipo.id}`}
                              className="btn-action-edit"
                            >
                              Editar
                            </Link>
                            <button
                              type="button"
                              className="btn-action-delete"
                              onClick={() =>
                                setDeleteTarget({
                                  kind: 'tipo',
                                  id: tipo.id!,
                                  label: `o tipo "${tipo.descricao}"`,
                                })
                              }
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <PaginationBar
              page={tiposFilter.page}
              totalPages={tiposPage.totalPages}
              totalRecords={tiposPage.totalRecords}
              onPageChange={(nextPage) =>
                setTiposFilter((prev) => ({ ...prev, page: nextPage }))
              }
            />
          </section>
        )}
      </main>

      {entradaModalOpen && (
        <EntradaModal
          tipos={allTipos}
          veiculos={allVeiculos}
          placaInicial={entradaPlacaInicial}
          tipoInicial={entradaTipoInicial}
          onClose={() => setEntradaModalOpen(false)}
          onSuccess={async () => {
            setEntradaModalOpen(false);
            showToast('success', 'Entrada registrada e ticket aberto com sucesso.');
            setTab('tickets');
            await carregarTudo();
          }}
        />
      )}

      {checkoutData && (
        <SaidaModal
          dados={checkoutData}
          onClose={() => setCheckoutData(null)}
          onSuccess={async () => {
            setCheckoutData(null);
            showToast('success', 'Saída registrada e ticket finalizado com sucesso.');
            await carregarTudo();
          }}
        />
      )}

      {deleteTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-sm">
            <div className="modal-header">
              <h3>Confirmar Exclusão</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <p className="modal-body-text">
              Tem certeza que deseja excluir <strong>{deleteTarget.label}</strong>? Esta ação não
              poderá ser desfeita.
            </p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancelar"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmarExclusao}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortControls({
  filter,
  options,
  onChange,
}: {
  filter: FilterPageable;
  options: { value: string; label: string }[];
  onChange: (next: FilterPageable) => void;
}) {
  const toggleDirection = () => {
    const nextDir: SortDirection = filter.direction === 'ASC' ? 'DESC' : 'ASC';
    onChange({ ...filter, page: 0, direction: nextDir });
  };

  return (
    <div className="sort-group">
      <select
        aria-label="Ordenar por"
        value={filter.orderBy}
        onChange={(e) => onChange({ ...filter, page: 0, orderBy: e.target.value })}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            Ordenar: {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn-sort-dir"
        onClick={toggleDirection}
        title={filter.direction === 'ASC' ? 'Ordem crescente' : 'Ordem decrescente'}
      >
        {filter.direction === 'ASC' ? '↑ Cresc.' : '↓ Decresc.'}
      </button>
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  totalRecords,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (nextPage: number) => void;
}) {
  if (totalRecords === 0) return null;
  const totalPaginasExibicao = Math.max(totalPages, 1);

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        {totalRecords} registro(s) · Página {page + 1} de {totalPaginasExibicao}
      </span>
      <div className="pagination-buttons">
        <button
          type="button"
          className="btn-page"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          ← Anterior
        </button>
        <button
          type="button"
          className="btn-page"
          disabled={page + 1 >= totalPaginasExibicao}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}

function EntradaModal({
  tipos,
  veiculos,
  placaInicial,
  tipoInicial,
  onClose,
  onSuccess,
}: {
  tipos: TipoVeiculo[];
  veiculos: Veiculo[];
  placaInicial: string;
  tipoInicial?: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [placa, setPlaca] = useState(placaInicial);
  const [tipoVeiculoId, setTipoVeiculoId] = useState(() => {
    if (tipoInicial) return String(tipoInicial);
    return tipos[0]?.id ? String(tipos[0].id) : '';
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const veiculoReconhecido = useMemo(() => {
    const limpa = placa.trim().toUpperCase();
    if (!limpa) return null;
    return veiculos.find((v) => v.placa.toUpperCase() === limpa) ?? null;
  }, [placa, veiculos]);

  const handlePlacaChange = (valor: string) => {
    const upper = valor.toUpperCase();
    setPlaca(upper);
    const match = veiculos.find((v) => v.placa.toUpperCase() === upper.trim());
    if (match) {
      setTipoVeiculoId(String(match.idTipoVeiculo));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const placaLimpa = placa.trim().toUpperCase();
    if (!placaLimpa) {
      setError('Informe a placa do veículo.');
      return;
    }
    if (!tipoVeiculoId) {
      setError('Selecione uma categoria de veículo.');
      return;
    }

    setSaving(true);
    try {
      await ticketService.registrarEntrada({
        placa: placaLimpa,
        tipoVeiculoId: Number(tipoVeiculoId),
      });
      await onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível registrar a entrada.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Registrar Entrada</h3>
            <p className="modal-subtitle">Gera um novo ticket com o horário atual</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {tipos.length === 0 && (
          <div className="alert alert-warning">
            Cadastre ao menos um{' '}
            <Link to="/cadastro-tipo-veiculo" className="inline-link">
              Tipo de Veículo
            </Link>{' '}
            antes de abrir um ticket.
          </div>
        )}

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label htmlFor="entrada-placa">
              Placa do Veículo <span className="required">*</span>
            </label>
            <input
              id="entrada-placa"
              type="text"
              className="input-placa"
              placeholder="ABC1D23"
              value={placa}
              onChange={(e) => handlePlacaChange(e.target.value)}
              maxLength={10}
              required
              autoFocus
            />
            {veiculoReconhecido ? (
              <span className="form-hint hint-recognized">
                Veículo cadastrado: {veiculoReconhecido.modelo || 'Modelo não informado'}
                {veiculoReconhecido.cor ? ` · ${veiculoReconhecido.cor}` : ''}
              </span>
            ) : placa.trim().length >= 3 ? (
              <span className="form-hint">
                Placa nova: o veículo será cadastrado automaticamente junto ao ticket.
              </span>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="entrada-tipo">
              Tipo de Veículo <span className="required">*</span>
            </label>
            <select
              id="entrada-tipo"
              value={tipoVeiculoId}
              onChange={(e) => setTipoVeiculoId(e.target.value)}
              required
              disabled={tipos.length === 0}
            >
              <option value="">Selecione uma categoria</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.descricao} — {formatCurrency(tipo.valorHora)}/h
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-salvar"
              disabled={saving || tipos.length === 0}
            >
              {saving ? 'Registrando...' : 'Confirmar Entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SaidaModal({
  dados,
  onClose,
  onSuccess,
}: {
  dados: DadosTicketSaida;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [dataHoraSaidaInput, setDataHoraSaidaInput] = useState(() =>
    toInputDateTime(dados.dataHoraSaida)
  );
  const [usouHorarioPersonalizado, setUsouHorarioPersonalizado] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const dataHoraSaida = usouHorarioPersonalizado
        ? toApiLocalDateTime(dataHoraSaidaInput)
        : dados.dataHoraSaida;

      await ticketService.registrarSaida({
        ticketId: dados.ticketId,
        dataHoraSaida,
      });
      await onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erro ao finalizar saída do ticket.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Registrar Saída</h3>
            <p className="modal-subtitle mono">Ticket #{dados.ticketId}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="checkout-summary">
          <div className="summary-row">
            <span>Placa</span>
            <span className="placa-badge">{dados.placaVeiculo}</span>
          </div>
          <div className="summary-row">
            <span>Entrada</span>
            <strong className="mono">{formatDateTime(dados.dataHoraEntrada)}</strong>
          </div>
          <div className="summary-row">
            <span>Saída prevista</span>
            <strong className="mono">{formatDateTime(dados.dataHoraSaida)}</strong>
          </div>
          <div className="summary-row">
            <span>Permanência</span>
            <strong className="mono">
              {formatDuration(
                dados.dataHoraEntrada,
                usouHorarioPersonalizado
                  ? toApiLocalDateTime(dataHoraSaidaInput)
                  : dados.dataHoraSaida
              )}
            </strong>
          </div>
          <div className="summary-total">
            <span>Valor calculado</span>
            <strong className="mono">{formatCurrency(dados.valorTotal)}</strong>
          </div>
        </div>

        <form onSubmit={handleConfirmar} className="cadastro-form">
          <div className="form-group">
            <label htmlFor="saida-datetime">Ajustar data/hora de saída (opcional)</label>
            <input
              id="saida-datetime"
              type="datetime-local"
              value={dataHoraSaidaInput}
              onChange={(e) => {
                setDataHoraSaidaInput(e.target.value);
                setUsouHorarioPersonalizado(true);
              }}
              required
            />
            {usouHorarioPersonalizado && (
              <span className="form-hint">
                O valor final será recalculado pelo servidor com base no novo horário.
              </span>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-confirm-checkout" disabled={saving}>
              {saving ? 'Finalizando...' : 'Confirmar Saída'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
