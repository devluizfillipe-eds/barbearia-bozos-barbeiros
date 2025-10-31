"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function AdminPainel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [barbeiros, setBarbeiros] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    online: 0,
    atendimentos: 0,
  });
  const [showAddBarberModal, setShowAddBarberModal] = useState(false);
  const [newBarber, setNewBarber] = useState({
    nome: "",
    email: "",
    senha: "",
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/admin");
  };

  const fetchBarbeiros = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/barbers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar barbeiros");
      }

      const data = await response.json();
      setBarbeiros(data);

      // Atualizar estatísticas
      setEstatisticas({
        total: data.length,
        online: data.filter((b: any) => b.disponivel).length,
        atendimentos: data.reduce(
          (acc: number, b: any) => acc + (b.atendimentos || 0),
          0
        ),
      });
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBarber = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/barbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBarber),
      });

      if (!response.ok) {
        throw new Error("Erro ao adicionar barbeiro");
      }

      // Limpar formulário e fechar modal
      setNewBarber({
        nome: "",
        email: "",
        senha: "",
      });
      setShowAddBarberModal(false);

      // Recarregar lista de barbeiros
      fetchBarbeiros();
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao adicionar barbeiro");
    }
  };

  useEffect(() => {
    // Verificar se o usuário está logado como admin
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.push("/admin");
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (!userData.roles?.includes("admin")) {
        router.push("/admin");
        return;
      }

      // Carregar lista de barbeiros
      fetchBarbeiros();

      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchBarbeiros, 30000);
      return () => clearInterval(interval);
    } catch (error) {
      console.error("Erro ao validar usuário:", error);
      router.push("/admin");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#2e2d37] text-white">
      {/* Logo e título */}
      <div className="w-full bg-[#26242d] py-8">
        <div className="max-w-3xl mx-auto text-center">
          <Image
            src="/images/logo.jpg"
            alt="BOZOS BARBEIROS"
            width={128}
            height={128}
            className="mx-auto rounded-full mb-4"
            priority
          />
          <div className="flex justify-between items-center px-4">
            <div>
              <h1 className="text-2xl font-bold text-[#f2b63a]">
                Painel Administrativo
              </h1>
              <p className="text-gray-300">Bem-vindo, Administrador</p>
            </div>

            {/* Botão Logout */}
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#4b4950] rounded-2xl p-4 text-center shadow-lg">
              <div className="text-2xl font-bold text-[#f2b63a]">
                {estatisticas.total}
              </div>
              <div className="text-gray-300">Total de Barbeiros</div>
            </div>
            <div className="bg-[#4b4950] rounded-2xl p-4 text-center shadow-lg">
              <div className="text-2xl font-bold text-green-400">
                {estatisticas.online}
              </div>
              <div className="text-gray-300">Barbeiros Online</div>
            </div>
            <div className="bg-[#4b4950] rounded-2xl p-4 text-center shadow-lg">
              <div className="text-2xl font-bold text-blue-400">
                {estatisticas.atendimentos}
              </div>
              <div className="text-gray-300">Total de Atendimentos</div>
            </div>
          </div>

          {/* Lista de Barbeiros */}
          <div className="bg-[#4b4950] rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#f2b63a]">
                Lista de Barbeiros
              </h2>
              <button
                onClick={() => {}}
                className="px-4 py-2 bg-[#f2b63a] hover:brightness-110 text-[#2e2d37] rounded-lg transition-all font-semibold flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Adicionar Barbeiro
              </button>
            </div>

            {loading ? (
              <div className="text-center text-gray-400 py-8">
                <div className="w-12 h-12 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Carregando lista de barbeiros...</p>
              </div>
            ) : barbeiros.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                Nenhum barbeiro cadastrado
              </div>
            ) : (
              <div className="space-y-3">
                {barbeiros.map((barbeiro) => (
                  <div
                    key={barbeiro.id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-white">
                          {barbeiro.nome}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Email: {barbeiro.email}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Status: {barbeiro.disponivel ? "Online" : "Offline"}
                        </p>
                        {barbeiro.atendimentos && (
                          <p className="text-gray-400 text-sm">
                            Total de atendimentos: {barbeiro.atendimentos}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            barbeiro.disponivel
                              ? "bg-green-500 animate-pulse"
                              : "bg-red-500"
                          }`}
                        ></div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            barbeiro.disponivel
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {barbeiro.disponivel ? "ONLINE" : "OFFLINE"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Adicionar Barbeiro */}
      {showAddBarberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#4b4950] p-6 rounded-2xl shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-[#f2b63a]">
              Adicionar Barbeiro
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={newBarber.nome}
                  onChange={(e) =>
                    setNewBarber({ ...newBarber, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#2e2d37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f2b63a]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newBarber.email}
                  onChange={(e) =>
                    setNewBarber({ ...newBarber, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#2e2d37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f2b63a]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={newBarber.senha}
                  onChange={(e) =>
                    setNewBarber({ ...newBarber, senha: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#2e2d37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f2b63a]"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddBarberModal(false)}
                className="px-4 py-2 bg-[#2e2d37] hover:bg-opacity-80 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddBarber}
                disabled={
                  !newBarber.nome || !newBarber.email || !newBarber.senha
                }
                className="px-4 py-2 bg-[#f2b63a] hover:brightness-110 text-[#2e2d37] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
