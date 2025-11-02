"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Barber {
  id: string;
  nome: string;
  disponivel: boolean;
}

export default function AdminPanel() {
  const router = useRouter();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newBarberName, setNewBarberName] = useState("");
  const [newBarberLogin, setNewBarberLogin] = useState("");
  const [newBarberPassword, setNewBarberPassword] = useState("");
  const [addingBarber, setAddingBarber] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetchBarbers();
  }, [router]);

  const fetchBarbers = async () => {
    try {
      const response = await fetch("http://localhost:3000/barbers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin");
          return;
        }
        throw new Error("Erro ao buscar barbeiros");
      }

      const data = await response.json();
      setBarbers(data);
    } catch (err) {
      setError("Erro ao carregar lista de barbeiros");
    } finally {
      setLoading(false);
    }
  };

  const addBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingBarber(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/barbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          nome: newBarberName,
          login: newBarberLogin,
          senha: newBarberPassword,
          disponivel: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao adicionar barbeiro");
      }

      setNewBarberName("");
      setNewBarberLogin("");
      setNewBarberPassword("");
      fetchBarbers();
    } catch (err) {
      setError("Erro ao adicionar barbeiro");
    } finally {
      setAddingBarber(false);
    }
  };

  const toggleBarberStatus = async (
    barberId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(
        `http://localhost:3000/barbers/${barberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            disponivel: !currentStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao atualizar status do barbeiro");
      }

      fetchBarbers();
    } catch (err) {
      setError("Erro ao atualizar status do barbeiro");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2e2d37] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl text-white">Carregando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2e2d37] text-white">
      {/* Header */}
      <div className="w-full bg-[#26242d] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Image
                src="/images/logo.jpg"
                alt="BOZOS BARBEIROS"
                width={64}
                height={64}
                className="rounded-full"
                priority
              />
              <div>
                <h1 className="text-2xl text-[#f2b63a] font-[700] font-['Almendra'] tracking-wider">
                  PAINEL ADMINISTRATIVO
                </h1>
                <p className="text-gray-400 text-sm">
                  Gerenciamento de Barbeiros
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Adicionar Barbeiro */}
        <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
          <h2 className="text-xl font-semibold text-[#f2b63a] mb-4">
            Adicionar Novo Barbeiro
          </h2>
          <form onSubmit={addBarber} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Nome do Barbeiro
              </label>
              <input
                type="text"
                value={newBarberName}
                onChange={(e) => setNewBarberName(e.target.value)}
                placeholder="Nome do barbeiro"
                className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Login
              </label>
              <input
                type="text"
                value={newBarberLogin}
                onChange={(e) => setNewBarberLogin(e.target.value)}
                placeholder="Login para acesso"
                className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={newBarberPassword}
                onChange={(e) => setNewBarberPassword(e.target.value)}
                placeholder="Senha para acesso"
                className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={addingBarber}
              className="w-full px-6 py-2 bg-[#f2b63a] text-[#2e2d37] font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {addingBarber ? "Adicionando..." : "Adicionar Barbeiro"}
            </button>
          </form>
        </div>

        {/* Lista de Barbeiros */}
        <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
          <h2 className="text-xl font-semibold text-[#f2b63a] mb-6">
            Barbeiros Cadastrados
          </h2>
          <div className="space-y-4">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className="flex items-center justify-between p-4 bg-[#2e2d37] rounded-lg border border-gray-700/50"
              >
                <span className="font-medium text-white">{barber.nome}</span>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      barber.disponivel
                        ? "bg-green-900/20 text-green-400 border border-green-500/20"
                        : "bg-red-900/20 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {barber.disponivel ? "Disponível" : "Indisponível"}
                  </span>
                  <button
                    onClick={() =>
                      toggleBarberStatus(barber.id, barber.disponivel)
                    }
                    className="px-4 py-2 bg-[#4b4950] text-white rounded-lg hover:bg-[#3d3b42] transition-colors"
                  >
                    {barber.disponivel
                      ? "Marcar Indisponível"
                      : "Marcar Disponível"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
