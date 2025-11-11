export class EnterQueueDto {
  nome!: string;
  telefone!: string;
  barbeiro_id!: number;
  serviceIds?: number[]; // IDs dos serviços selecionados (opcional)
}
