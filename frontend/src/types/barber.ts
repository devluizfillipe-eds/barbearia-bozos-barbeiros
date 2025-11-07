export interface Barber {
  id: number;
  nome: string;
  email: string;
  disponivel: boolean;
  foto_url?: string;
  atendimentos?: number;
  senha?: string;
}
