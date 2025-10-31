"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export default function LoginAdmin() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
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
          type: "admin",
        }),
      });

      const data = await response.json();
      console.log("Resposta do servidor:", data); // Adicionado para debug

      if (!response.ok && response.status !== 201) {
        console.error("Erro na resposta:", data);
        throw new Error(data.message || data.error || "Credenciais inválidas");
      }

      if (!data.access_token || !data.user) {
        throw new Error("Resposta do servidor inválida");
      }

      // Usar o contexto de autenticação para fazer login
      authLogin(data.access_token, data.user);

      // Redirecionar para a página de carregamento
      router.push("/admin/loading");
    } catch (error) {
      console.error("Erro no login:", error);
      setError("Login ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-gray-300 font-regular">Área Administrativa</p>
        </div>
      </div>

      {/* Título Principal */}
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <h1 className="text-3xl text-[#f2b63a] font-[700] text-center font-['Almendra'] tracking-wider">
          LOGIN ADMINISTRATIVO
        </h1>
      </div>

      {/* Conteúdo Principal */}
      <main className="max-w-3xl mx-auto mt-8 px-4 space-y-4">
        <div className="bg-[#4b4950] rounded-2xl p-6 shadow-lg max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Login Admin
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f2b63a]"
                placeholder="Seu login administrativo"
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
                className="w-full px-3 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f2b63a]"
                placeholder="Sua senha"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f2b63a] hover:brightness-110 disabled:opacity-70 text-[#2e2d37] font-bold py-3 px-6 rounded-lg transition-all"
            >
              {loading ? "Entrando..." : "Entrar como Admin"}
            </button>
          </form>
        </div>
      </main>

      {/* Footer/Navegação */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-[#4b4950] rounded-full px-6 py-3 shadow-lg flex items-center space-x-6">
          <button
            onClick={() => router.push("/")}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sou Cliente
          </button>
          <button
            onClick={() => router.push("/barbeiro")}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sou Barbeiro
          </button>
          <button className="text-[#f2b63a] font-semibold">Sou Admin</button>
        </div>
      </div>
    </div>
  );
}
