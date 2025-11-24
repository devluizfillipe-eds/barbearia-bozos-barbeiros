// Tipos
export interface Service {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  tempo_estimado: number;
  ativo: boolean;
}

export interface LoginCredentials {
  login: string;
  password: string;
  type: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    nome: string;
    roles: string[];
    primaryRole: string;
    barberId: number | null;
    foto_url?: string | null;
  };
}

export interface Barber {
  id: number;
  nome: string;
  login: string;
  foto_url?: string | null;
  ativo: boolean;
  disponivel: boolean;
  data_criacao: string;
}

export interface AdminProfile {
  id: number;
  nome: string;
  login: string;
  foto_url?: string | null;
  data_criacao: string;
}

let API_URL = process.env.NEXT_PUBLIC_API_URL || "https://barbearia-backend-diq0.onrender.com";

// Se a URL não começar com http (ex: veio apenas o host do Render), adiciona https://
if (!API_URL.startsWith('http')) {
  API_URL = `https://${API_URL}`;
}

export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro na requisição");
    }

    return data;
  } catch (error) {
    console.error("Erro na API:", error);
    throw error;
  }
}

// Função específica para login
export async function login(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  return fetchAPI<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

// Função para buscar serviços ativos
export async function fetchServices(): Promise<Service[]> {
  return fetchAPI<Service[]>("/services/active");
}

// Função para buscar barbeiros disponíveis
export async function fetchAvailableBarbers(): Promise<Barber[]> {
  return fetchAPI<Barber[]>("/barbers/disponiveis");
}

export async function fetchAdminProfile(token: string): Promise<AdminProfile> {
  return fetchAPI<AdminProfile>("/admins/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Removido: fetchFeaturedAdmin e tipo PublicAdmin não são mais utilizados

// Função para verificar estado do backend
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error("Erro ao verificar estado do backend:", error);
    return false;
  }
}
