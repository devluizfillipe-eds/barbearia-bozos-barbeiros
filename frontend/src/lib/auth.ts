// Tipos
interface User {
  id: number;
  nome: string;
  roles: string[];
  primaryRole: string;
  barberId: number | null;
  foto_url?: string | null;
  type: "admin" | "barber";
}

// Funções para gerenciar o token
export const getToken = () => localStorage.getItem("token");
export const setToken = (token: string) => localStorage.setItem("token", token);
export const removeToken = () => localStorage.removeItem("token");

// Funções para gerenciar os dados do usuário
export const getUser = (): User | null => {
  const userData = localStorage.getItem("user");
  return userData ? JSON.parse(userData) : null;
};

export const setUser = (user: Omit<User, "type">, type: "admin" | "barber") => {
  localStorage.setItem(
    "user",
    JSON.stringify({
      ...user,
      type,
    })
  );
};

export const removeUser = () => localStorage.removeItem("user");

// Função para verificar se o usuário está autenticado
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!token && !!user;
};

// Função para fazer logout
export const logout = () => {
  removeToken();
  removeUser();
};
