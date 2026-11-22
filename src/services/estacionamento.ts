import { api, getDeduplicado } from './api';
import type {
  DadosTicketSaida,
  FilterPageable,
  IndicadoresDashboard,
  ResponsePagedCommom,
  Ticket,
  TicketEntradaRequest,
  TicketSaidaRequest,
  TipoVeiculo,
  Veiculo,
} from '../types/estacionamento';

export const dashboardService = {
  buscarIndicadores: (): Promise<IndicadoresDashboard> =>
    getDeduplicado<IndicadoresDashboard>('/dashboard/indicadores', {}),
};

export const tipoVeiculoService = {
  listar: (params: FilterPageable): Promise<ResponsePagedCommom<TipoVeiculo>> =>
    getDeduplicado<ResponsePagedCommom<TipoVeiculo>>('/tipo-veiculo', params),

  listarOpcoes: (): Promise<TipoVeiculo[]> =>
    getDeduplicado<TipoVeiculo[]>('/tipo-veiculo/opcoes', {}),

  buscarPorId: (id: number): Promise<TipoVeiculo> =>
    getDeduplicado<TipoVeiculo>(`/tipo-veiculo/edicao/${id}`, {}),

  salvar: async (data: TipoVeiculo): Promise<number> => {
    const response = await api.post<number>('/tipo-veiculo/save', data);
    return response.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/tipo-veiculo/${id}`);
  },
};

export const veiculoService = {
  listar: (params: FilterPageable): Promise<ResponsePagedCommom<Veiculo>> =>
    getDeduplicado<ResponsePagedCommom<Veiculo>>('/veiculo', params),

  buscarPorId: (id: number): Promise<Veiculo> =>
    getDeduplicado<Veiculo>(`/veiculo/edicao/${id}`, {}),

  // O backend responde 204 quando a placa ainda não está cadastrada
  buscarPorPlaca: async (placa: string): Promise<Veiculo | null> => {
    const veiculo = await getDeduplicado<Veiculo | ''>(
      `/veiculo/placa/${encodeURIComponent(placa)}`,
      {}
    );
    return veiculo || null;
  },

  salvar: async (data: Veiculo): Promise<number> => {
    const response = await api.post<number>('/veiculo/save', data);
    return response.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/veiculo/${id}`);
  },
};

export const ticketService = {
  listar: (params: FilterPageable): Promise<ResponsePagedCommom<Ticket>> =>
    getDeduplicado<ResponsePagedCommom<Ticket>>('/tickets', params),

  registrarEntrada: async (data: TicketEntradaRequest): Promise<number> => {
    const response = await api.post<number>('/tickets/save', data);
    return response.data;
  },

  buscarDadosSaida: async (ticketId: number): Promise<DadosTicketSaida> => {
    const response = await api.get<DadosTicketSaida>(`/tickets/get-dados-saida/${ticketId}`);
    return response.data;
  },

  registrarSaida: async (data: TicketSaidaRequest): Promise<void> => {
    await api.post('/tickets/registrar-saida', data);
  },
};
