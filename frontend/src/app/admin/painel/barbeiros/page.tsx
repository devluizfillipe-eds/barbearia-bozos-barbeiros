"use client";

import { useEffect, useState } from "react";

interface Barber {
  id: number;
  nome: string;
  login: string;
  ativo: boolean;
  disponivel: boolean;
  data_criacao: string;
}

export default function BarbeirosAdmin() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
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
      setBarbers(data);
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

      setNewBarber({ nome: "", login: "", senha: "" });
      setShowAddModal(false);
      fetchBarbers();
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao adicionar barbeiro");
    }
  };

  const toggleBarberStatus = async (barberId: number, ativo: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/barbers/${barberId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ativo }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }

      fetchBarbers();
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar status do barbeiro");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-xl text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">
          Gestão de Barbeiros
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Adicionar Barbeiro
        </button>
      </div>

      {/* Lista de Barbeiros */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="px-6 py-4 text-gray-400">Nome</th>
                <th className="px-6 py-4 text-gray-400">Login</th>
                <th className="px-6 py-4 text-gray-400">Status</th>
                <th className="px-6 py-4 text-gray-400">Disponibilidade</th>
                <th className="px-6 py-4 text-gray-400">Data de Cadastro</th>
                <th className="px-6 py-4 text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {barbers.map((barber) => (
                <tr key={barber.id}>
                  <td className="px-6 py-4 text-white">{barber.nome}</td>
                  <td className="px-6 py-4 text-white">{barber.login}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        barber.ativo
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {barber.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        barber.disponivel
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {barber.disponivel ? "Disponível" : "Indisponível"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(barber.data_criacao).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        toggleBarberStatus(barber.id, !barber.ativo)
                      }
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        barber.ativo
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {barber.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Barbeiro */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Adicionar Barbeiro</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={newBarber.nome}
                  onChange={(e) =>
                    setNewBarber({ ...newBarber, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Login
                </label>
                <input
                  type="text"
                  value={newBarber.login}
                  onChange={(e) =>
                    setNewBarber({ ...newBarber, login: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={newBarber.senha}
                  onChange={(e) =>
                    setNewBarber({ ...newBarber, senha: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddBarber}
                disabled={
                  !newBarber.nome || !newBarber.login || !newBarber.senha
                }
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
