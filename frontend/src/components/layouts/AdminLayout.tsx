import { ReactNode } from "react";
import { Header } from "@/components/ui";
import Link from "next/link";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-barbearia-background text-white">
      <Header
        title="Painel Administrativo"
        subtitle="Bem-vindo, Administrador"
      />

      {/* Navegação */}
      <nav className="bg-barbearia-header border-b border-barbearia-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex space-x-8">
              <NavLink href="/admin/painel?tab=fila" activePattern="fila">
                Minha Fila
              </NavLink>
              <NavLink
                href="/admin/painel?tab=dashboard"
                activePattern="dashboard"
              >
                Dashboard
              </NavLink>
              <NavLink
                href="/admin/painel?tab=barbeiros"
                activePattern="barbeiros"
              >
                Barbeiros
              </NavLink>
              <NavLink
                href="/admin/painel?tab=servicos"
                activePattern="servicos"
              >
                Serviços
              </NavLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
  activePattern,
}: {
  href: string;
  children: ReactNode;
  activePattern: string;
}) {
  const isActive =
    typeof window !== "undefined" &&
    window.location.href.includes(activePattern);

  return (
    <Link
      href={href}
      className={`px-3 py-2 text-sm font-medium ${
        isActive
          ? "text-barbearia-accent border-b-2 border-barbearia-accent"
          : "text-gray-300 hover:text-white hover:border-b-2 hover:border-gray-300"
      }`}
    >
      {children}
    </Link>
  );
}
