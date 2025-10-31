"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [activeTab, setActiveTab] = useState("fila");

  useEffect(() => {
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

      setAdminName(userData.nome);
    } catch (error) {
      console.error("Erro ao processar dados do usuário:", error);
      router.push("/admin");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/admin");
  };

  const menuItems = [
    { id: "fila", label: "Minha Fila", path: "/admin/painel/fila" },
    { id: "dashboard", label: "Dashboard", path: "/admin/painel/dashboard" },
    { id: "barbeiros", label: "Barbeiros", path: "/admin/painel/barbeiros" },
    { id: "servicos", label: "Serviços", path: "/admin/painel/servicos" },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-yellow-500">
                Painel Administrativo
              </h1>
              <p className="text-gray-400">Bem-vindo, {adminName}</p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  router.push(item.path);
                }}
                className={`px-4 py-3 font-semibold transition-colors ${
                  activeTab === item.id
                    ? "text-yellow-500 border-b-2 border-yellow-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
