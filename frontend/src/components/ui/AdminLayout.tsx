import { ReactNode } from "react";
import { Header } from "./Header";

interface AdminLayoutProps {
  children: ReactNode;
  isLoading?: boolean;
}

export function AdminLayout({ children, isLoading }: AdminLayoutProps) {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-barbearia-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-barbearia-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-barbearia-background">
      <div className="min-h-screen flex flex-col">
        <Header
          title="Painel Administrativo"
          subtitle="Bem-vindo, Administrador"
        />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
