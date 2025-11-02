import { Service } from "./service";

export interface QueueEntry {
  id: number;
  cliente_id: number;
  barbeiro_id: number;
  status: string;
  posicao: number;
  hora_entrada: string;
  hora_saida: string | null;
  servicos: Service[];
  cliente: {
    id: number;
    nome: string;
    telefone: string;
    data_criacao: string;
  };
}
