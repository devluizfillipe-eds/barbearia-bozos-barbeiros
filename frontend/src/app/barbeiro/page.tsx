"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginBarbeiro() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login,
          password,
          type: "barber",
        }),
      });

      if (!response.ok) {
        throw new Error("Credenciais inválidas");
      }

      const data = await response.json();

      // Salvar token e dados do usuário
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirecionar para o painel do barbeiro
      router.push("/barbeiro/painel");
    } catch (error) {
      console.error("Erro no login:", error);
      setError("Login ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-500 mb-2">
            BOZO`S BARBEIROS
          </h1>
          <p className="text-gray-400">Área do Barbeiro</p>
        </div>

        {/* Card de Login */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Login
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                placeholder="Seu login"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                placeholder="Sua senha"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Link para voltar */}
          <div className="text-center mt-4">
            <button
              onClick={() => router.push("/")}
              className="text-yellow-500 hover:text-yellow-400 text-sm"
            >
              ← Voltar para o site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
