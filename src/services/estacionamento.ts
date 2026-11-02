import { api } from './api';
import type { Cliente, ClienteRequest, Veiculo, VeiculoRequest } from '../types/estacionamento';

export const clienteService = {
  listar: async (): Promise<Cliente[]> => {
    const response = await api.get<Cliente[]>('/clientes');
    return response.data;
  },

  buscarPorId: async (id: number): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  criar: async (data: ClienteRequest): Promise<Cliente> => {
    const response = await api.post<Cliente>('/clientes', data);
    return response.data;
  },

  atualizar: async (id: number, data: ClienteRequest): Promise<Cliente> => {
    const response = await api.put<Cliente>(`/clientes/${id}`, data);
    return response.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  },
};

export const veiculoService = {
  listar: async (): Promise<Veiculo[]> => {
    const response = await api.get<Veiculo[]>('/veiculos');
    return response.data;
  },

  listarPorCliente: async (clienteId: number): Promise<Veiculo[]> => {
    const response = await api.get<Veiculo[]>(`/veiculos/cliente/${clienteId}`);
    return response.data;
  },

  listarNoEstacionamento: async (): Promise<Veiculo[]> => {
    const response = await api.get<Veiculo[]>('/veiculos/no-estacionamento');
    return response.data;
  },

  buscarPorId: async (id: number): Promise<Veiculo> => {
    const response = await api.get<Veiculo>(`/veiculos/${id}`);
    return response.data;
  },

  criar: async (data: VeiculoRequest): Promise<Veiculo> => {
    const response = await api.post<Veiculo>('/veiculos', data);
    return response.data;
  },

  atualizar: async (id: number, data: VeiculoRequest): Promise<Veiculo> => {
    const response = await api.put<Veiculo>(`/veiculos/${id}`, data);
    return response.data;
  },

  registrarSaida: async (id: number): Promise<Veiculo> => {
    const response = await api.put<Veiculo>(`/veiculos/${id}/saida`, {});
    return response.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/veiculos/${id}`);
  },
};
