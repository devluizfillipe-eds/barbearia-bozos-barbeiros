export class CreateServiceDto {
  nome: string;
  descricao?: string;
  tempo_estimado: number;
  preco: number;
  ativo?: boolean;
}
