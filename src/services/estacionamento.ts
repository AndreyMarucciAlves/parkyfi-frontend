import { api } from './api';
import type {
  DadosTicketSaida,
  FilterPageable,
  ResponsePagedCommom,
  Ticket,
  TicketEntradaRequest,
  TicketSaidaRequest,
  TipoVeiculo,
  Veiculo,
} from '../types/estacionamento';

export const tipoVeiculoService = {
  listar: async (params: FilterPageable): Promise<ResponsePagedCommom<TipoVeiculo>> => {
    const response = await api.get<ResponsePagedCommom<TipoVeiculo>>('/tipo-veiculo', { params });
    return response.data;
  },

  buscarPorId: async (id: number): Promise<TipoVeiculo> => {
    const response = await api.get<TipoVeiculo>(`/tipo-veiculo/edicao/${id}`);
    return response.data;
  },

  salvar: async (data: TipoVeiculo): Promise<number> => {
    const response = await api.post<number>('/tipo-veiculo/save', data);
    return response.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/tipo-veiculo/${id}`);
  },
};

export const veiculoService = {
  listar: async (params: FilterPageable): Promise<ResponsePagedCommom<Veiculo>> => {
    const response = await api.get<ResponsePagedCommom<Veiculo>>('/veiculo', { params });
    return response.data;
  },

  buscarPorId: async (id: number): Promise<Veiculo> => {
    const response = await api.get<Veiculo>(`/veiculo/edicao/${id}`);
    return response.data;
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
  listar: async (params: FilterPageable): Promise<ResponsePagedCommom<Ticket>> => {
    const response = await api.get<ResponsePagedCommom<Ticket>>('/tickets', { params });
    return response.data;
  },

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
