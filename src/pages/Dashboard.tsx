import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { getApiErrorMessage } from '../services/api';
import {
  dashboardService,
  ticketService,
  tipoVeiculoService,
  veiculoService,
} from '../services/estacionamento';
import type {
  DadosTicketSaida,
  FilterPageable,
  IndicadoresDashboard,
  SortDirection,
  StatusTicket,
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
const PAGE_SIZE_OPTIONS = [1, 2, 5, 10, 20, 50, 100];

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

function getVisiblePages(page: number, totalPages: number): (number | 'gap')[] {
  const pages = [...new Set([0, page - 1, page, page + 1, totalPages - 1])]
    .filter((value) => value >= 0 && value < totalPages)
    .sort((a, b) => a - b);

  return pages.flatMap((value, index) => {
    const previous = pages[index - 1];
    if (previous === undefined || value === previous + 1) return [value];
    return value === previous + 2 ? [previous + 1, value] : (['gap', value] as const);
  });
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
  const [indicadoresError, setIndicadoresError] = useState('');
  const [tiposError, setTiposError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  const [ticketStatusFilter, setTicketStatusFilter] = useState<'TODOS' | StatusTicket>('TODOS');
  const [ticketSearch, setTicketSearch] = useState('');

  // O status é filtrado no backend, para a paginação considerar todos os tickets daquele status
  const listarTickets = useCallback(
    (filter: FilterPageable) =>
      ticketService.listar(filter, ticketStatusFilter === 'TODOS' ? undefined : ticketStatusFilter),
    [ticketStatusFilter]
  );

  const ticketsList = usePaginatedList<Ticket>({
    fetcher: listarTickets,
    initialFilter: { page: 0, size: DEFAULT_PAGE_SIZE, direction: 'DESC', orderBy: 'id' },
    enabled: activeTab === 'tickets',
    refreshToken,
    errorMessage: 'Erro ao carregar os tickets.',
    queryKey: ticketStatusFilter,
  });
  const { page: ticketsPage, filter: ticketsFilter, setFilter: setTicketsFilter } = ticketsList;

  const veiculosList = usePaginatedList<Veiculo>({
    fetcher: veiculoService.listar,
    initialFilter: { page: 0, size: DEFAULT_PAGE_SIZE, direction: 'ASC', orderBy: 'placa' },
    enabled: activeTab === 'veiculos',
    refreshToken,
    errorMessage: 'Erro ao carregar os veículos.',
  });
  const { page: veiculosPage, filter: veiculosFilter, setFilter: setVeiculosFilter } = veiculosList;

  const tiposList = usePaginatedList<TipoVeiculo>({
    fetcher: tipoVeiculoService.listar,
    initialFilter: { page: 0, size: DEFAULT_PAGE_SIZE, direction: 'ASC', orderBy: 'descricao' },
    enabled: activeTab === 'tipos',
    refreshToken,
    errorMessage: 'Erro ao carregar os tipos de veículo.',
  });
  const { page: tiposPage, filter: tiposFilter, setFilter: setTiposFilter } = tiposList;

  const activeList =
    activeTab === 'tickets' ? ticketsList : activeTab === 'veiculos' ? veiculosList : tiposList;
  const loading = activeList.loading;
  const connectionError = activeList.error || indicadoresError || tiposError;

  const [indicadores, setIndicadores] = useState<IndicadoresDashboard>({
    ticketsAbertos: 0,
    ticketsFechados: 0,
    faturamento: 0,
    totalVeiculos: 0,
    totalTipos: 0,
    placasNoPatio: [],
  });
  const [opcoesTipos, setOpcoesTipos] = useState<TipoVeiculo[]>([]);
  const [tiposCarregadosEm, setTiposCarregadosEm] = useState<number | null>(null);

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

  const carregarTudo = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    dashboardService
      .buscarIndicadores()
      .then((dados) => {
        if (cancelled) return;
        setIndicadores(dados);
        setIndicadoresError('');
      })
      .catch((err) => {
        if (!cancelled) {
          setIndicadoresError(getApiErrorMessage(err, 'Erro ao carregar os indicadores.'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  // As opções de tipo só são buscadas quando a aba de veículos ou o modal de entrada precisam delas
  const precisaTipos = activeTab === 'veiculos' || entradaModalOpen;

  useEffect(() => {
    if (!precisaTipos || tiposCarregadosEm === refreshToken) return;

    let cancelled = false;

    tipoVeiculoService
      .listarOpcoes()
      .then((tipos) => {
        if (cancelled) return;
        setOpcoesTipos(tipos);
        setTiposError('');
        setTiposCarregadosEm(refreshToken);
      })
      .catch((err) => {
        if (cancelled) return;
        setTiposError(getApiErrorMessage(err, 'Erro ao carregar os tipos de veículo.'));
        setTiposCarregadosEm(refreshToken);
      });

    return () => {
      cancelled = true;
    };
  }, [precisaTipos, refreshToken, tiposCarregadosEm]);

  const tiposById = useMemo(() => {
    const map = new Map<number, TipoVeiculo>();
    for (const tipo of opcoesTipos) {
      if (tipo.id) map.set(tipo.id, tipo);
    }
    return map;
  }, [opcoesTipos]);

  const activePlates = useMemo(
    () => new Set(indicadores.placasNoPatio.map((placa) => placa.toUpperCase())),
    [indicadores.placasNoPatio]
  );

  const kpis = {
    abertos: indicadores.ticketsAbertos,
    fechados: indicadores.ticketsFechados,
    faturamento: indicadores.faturamento,
    totalVeiculos: indicadores.totalVeiculos,
    totalTipos: indicadores.totalTipos,
  };

  const ticketsVisiveis = useMemo(() => {
    const termo = ticketSearch.trim().toUpperCase();
    if (!termo) return ticketsPage.data;
    return ticketsPage.data.filter((ticket) => ticket.placa.toUpperCase().includes(termo));
  }, [ticketsPage.data, ticketSearch]);

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
      carregarTudo();
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
                    onClick={() => {
                      if (status === ticketStatusFilter) return;
                      setTicketStatusFilter(status);
                      setTicketsFilter((prev) => ({ ...prev, page: 0 }));
                    }}
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
              size={ticketsFilter.size}
              totalPages={ticketsPage.totalPages}
              totalRecords={ticketsPage.totalRecords}
              disabled={loading}
              onPageChange={(nextPage) =>
                setTicketsFilter((prev) => ({ ...prev, page: nextPage }))
              }
              onSizeChange={(size) => setTicketsFilter((prev) => ({ ...prev, page: 0, size }))}
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
              size={veiculosFilter.size}
              totalPages={veiculosPage.totalPages}
              totalRecords={veiculosPage.totalRecords}
              disabled={loading}
              onPageChange={(nextPage) =>
                setVeiculosFilter((prev) => ({ ...prev, page: nextPage }))
              }
              onSizeChange={(size) => setVeiculosFilter((prev) => ({ ...prev, page: 0, size }))}
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
              size={tiposFilter.size}
              totalPages={tiposPage.totalPages}
              totalRecords={tiposPage.totalRecords}
              disabled={loading}
              onPageChange={(nextPage) =>
                setTiposFilter((prev) => ({ ...prev, page: nextPage }))
              }
              onSizeChange={(size) => setTiposFilter((prev) => ({ ...prev, page: 0, size }))}
            />
          </section>
        )}
      </main>

      {entradaModalOpen && (
        <EntradaModal
          tipos={opcoesTipos}
          tiposCarregados={tiposCarregadosEm !== null}
          placaInicial={entradaPlacaInicial}
          tipoInicial={entradaTipoInicial}
          onClose={() => setEntradaModalOpen(false)}
          onSuccess={() => {
            setEntradaModalOpen(false);
            showToast('success', 'Entrada registrada e ticket aberto com sucesso.');
            setTab('tickets');
            carregarTudo();
          }}
        />
      )}

      {checkoutData && (
        <SaidaModal
          dados={checkoutData}
          onClose={() => setCheckoutData(null)}
          onSuccess={() => {
            setCheckoutData(null);
            showToast('success', 'Saída registrada e ticket finalizado com sucesso.');
            carregarTudo();
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
  size,
  totalPages,
  totalRecords,
  disabled,
  onPageChange,
  onSizeChange,
}: {
  page: number;
  size: number;
  totalPages: number;
  totalRecords: number;
  disabled: boolean;
  onPageChange: (nextPage: number) => void;
  onSizeChange: (nextSize: number) => void;
}) {
  if (totalRecords === 0) return null;
  const totalPaginasExibicao = Math.max(totalPages, 1);

  return (
    <div className="pagination-bar">
      <div className="pagination-summary">
        <span className="pagination-info">
          {totalRecords} registro(s) · Página {page + 1} de {totalPaginasExibicao}
        </span>
        <label className="pagination-field">
          Por página
          <select
            value={size}
            disabled={disabled}
            onChange={(e) => onSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="pagination-buttons">
        <button
          type="button"
          className="btn-page"
          disabled={disabled || page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          ← Anterior
        </button>
        {getVisiblePages(page, totalPaginasExibicao).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className="pagination-gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`btn-page btn-page-number ${item === page ? 'active' : ''}`}
              aria-label={`Ir para a página ${item + 1}`}
              aria-current={item === page ? 'page' : undefined}
              disabled={disabled}
              onClick={() => item !== page && onPageChange(item)}
            >
              {item + 1}
            </button>
          )
        )}
        <button
          type="button"
          className="btn-page"
          disabled={disabled || page + 1 >= totalPaginasExibicao}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima →
        </button>

        <label className="pagination-field">
          Ir para a página
          <select
            value={page}
            disabled={disabled || totalPaginasExibicao <= 1}
            onChange={(e) => onPageChange(Number(e.target.value))}
          >
            {Array.from({ length: totalPaginasExibicao }, (_, index) => (
              <option key={index} value={index}>
                {index + 1}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function EntradaModal({
  tipos,
  tiposCarregados,
  placaInicial,
  tipoInicial,
  onClose,
  onSuccess,
}: {
  tipos: TipoVeiculo[];
  tiposCarregados: boolean;
  placaInicial: string;
  tipoInicial?: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [placa, setPlaca] = useState(placaInicial);
  const [tipoEscolhido, setTipoEscolhido] = useState<string | null>(
    tipoInicial ? String(tipoInicial) : null
  );
  const [consultaPlaca, setConsultaPlaca] = useState<{
    placa: string;
    veiculo: Veiculo | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const tipoVeiculoId = tipoEscolhido ?? (tipos[0]?.id ? String(tipos[0].id) : '');
  const placaLimpa = placa.trim();
  const consultaAtual = consultaPlaca?.placa === placaLimpa ? consultaPlaca : null;
  const veiculoReconhecido = consultaAtual?.veiculo ?? null;

  // Aguarda o usuário parar de digitar antes de consultar a placa
  useEffect(() => {
    if (placaLimpa.length < 3) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      veiculoService
        .buscarPorPlaca(placaLimpa)
        .then((veiculo) => {
          if (cancelled) return;
          setConsultaPlaca({ placa: placaLimpa, veiculo });
          if (veiculo) setTipoEscolhido(String(veiculo.idTipoVeiculo));
        })
        .catch(() => {
          if (!cancelled) setConsultaPlaca(null);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placaLimpa]);

  const handlePlacaChange = (valor: string) => {
    setPlaca(valor);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

        {tiposCarregados && tipos.length === 0 && (
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
            ) : consultaAtual ? (
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
              onChange={(e) => setTipoEscolhido(e.target.value)}
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
