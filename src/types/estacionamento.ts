export type SortDirection = 'ASC' | 'DESC';

export interface FilterPageable {
  page: number;
  size: number;
  direction: SortDirection;
  orderBy: string;
}

export interface ResponsePagedCommom<T> {
  data: T[];
  totalRecords: number;
  totalPages: number;
  pageSize: number;
}

export type StatusTicket = 'ABERTO' | 'FECHADO';

export interface TipoVeiculo {
  id?: number;
  descricao: string;
  valorHora: number;
}

export interface Veiculo {
  id?: number;
  placa: string;
  modelo: string | null;
  cor: string | null;
  idTipoVeiculo: number;
}

export interface Ticket {
  id: number;
  veiculoId: number;
  placa: string;
  dataEntrada: string;
  dataSaida: string | null;
  valorTotal: number | null;
  status: StatusTicket;
}

export interface TicketEntradaRequest {
  placa: string;
  tipoVeiculoId: number;
}

export interface DadosTicketSaida {
  ticketId: number;
  valorTotal: number;
  veiculoId: number;
  placaVeiculo: string;
  dataHoraEntrada: string;
  dataHoraSaida: string;
}

export interface TicketSaidaRequest {
  ticketId: number;
  dataHoraSaida: string;
}
