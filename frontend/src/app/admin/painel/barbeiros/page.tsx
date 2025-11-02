"use client";

import { useEffect, useState } from "react";

interface Barber {
  id: string;
  nome: string;
  login: string;
  disponivel: boolean;
}

export default function BarbeirosAdmin() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newBarber, setNewBarber] = useState({
    nome: "",
    login: "",
    senha: "",
  });

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const response = await fetch("http://localhost:3000/barbers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) throw new Error("Falha ao carregar barbeiros");

      const data = await response.json();
      setBarbers(data);
    } catch (err) {
      setError("Erro ao carregar lista de barbeiros");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3000/barbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          nome: newBarber.nome,
          login: newBarber.login,
          senha: newBarber.senha,
          disponivel: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Falha ao adicionar barbeiro");
      }

      setNewBarber({ nome: "", login: "", senha: "" });
      fetchBarbers();
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar barbeiro");
      console.error(err);
    }
  };

  const toggleBarberStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:3000/barbers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ disponivel: !currentStatus }),
      });

      if (!response.ok)
        throw new Error("Falha ao atualizar status do barbeiro");

      fetchBarbers();
    } catch (err) {
      setError("Erro ao atualizar status do barbeiro");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-xl text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            type="text"
            value={newBarber.nome}
            onChange={(e) =>
              setNewBarber({ ...newBarber, nome: e.target.value })
            }
            placeholder="Nome do barbeiro"
            className="px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
            required
          />
          <input
            type="text"
            value={newBarber.login}
            onChange={(e) =>
              setNewBarber({ ...newBarber, login: e.target.value })
            }
            placeholder="Login"
            className="px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
            required
          />
          <div className="flex gap-4">
            <input
              type="password"
              value={newBarber.senha}
              onChange={(e) =>
                setNewBarber({ ...newBarber, senha: e.target.value })
              }
              placeholder="Senha"
              className="flex-1 px-4 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f2b63a] transition-colors"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-[#f2b63a] text-[#2e2d37] font-semibold rounded-lg hover:brightness-110 transition-all"
            >
              Adicionar
            </button>
          </div>
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
              <div>
                <h3 className="font-medium text-white">{barber.nome}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Login: {barber.login}
                </p>
              </div>
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
  );
}
