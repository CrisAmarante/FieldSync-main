'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

// Barra de navegação superior, presente em toda página autenticada. Os links
// de Usuários/Sessões só aparecem para os perfis com permissão — isso é só
// UX; a autorização real é sempre aplicada de novo no Backend. A gestão de
// conflitos não tem mais rota/aba própria — vive dentro do Painel
// Operacional de cada pesquisa (/surveys/[id]/responses).
const USER_MANAGEMENT_ROLES = ['ADMINISTRADOR', 'GESTOR', 'SUPERVISOR'];
// VISUALIZADOR só enxerga dados (Dashboard/Analytics/Painel/mapa) — a aba de
// Sessões (gestão de dispositivos logados) fica bloqueada para esse perfil.
const SESSIONS_BLOCKED_ROLES = ['VISUALIZADOR'];

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
      <div className="flex flex-wrap items-center gap-6">
        <span className="font-semibold">FieldSync</span>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            Painel
          </Link>
          <Link href="/surveys" className="hover:text-foreground">
            Pesquisas
          </Link>
          {user && USER_MANAGEMENT_ROLES.includes(user.role) && (
            <Link href="/users" className="hover:text-foreground">
              Usuários
            </Link>
          )}
          {user && !SESSIONS_BLOCKED_ROLES.includes(user.role) && (
            <Link href="/sessions" className="hover:text-foreground">
              Sessões
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {user && (
          <span className="text-muted-foreground">
            {user.name} · {user.role}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => logout()}>
          Sair
        </Button>
      </div>
    </header>
  );
}
