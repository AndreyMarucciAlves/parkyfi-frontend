export interface Cliente {
  id?: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  criadoEm?: string;
}

export interface ClienteRequest {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
}

export interface Veiculo {
  id?: number;
  placa: string;
  modelo: string;
  cor: string;
  clienteId: number;
  entrada?: string;
  saida?: string;
}

export interface VeiculoRequest {
  placa: string;
  modelo: string;
  cor: string;
  clienteId: number;
}
