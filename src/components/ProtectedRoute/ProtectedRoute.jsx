import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

// Componente para proteger rotas que precisam de autenticação
export function ProtectedRoute({
  children,
  roles = [],
  redirectTo = '/login',
}) {
  const { isAuthenticated, loading, userRole, adminStatus } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{
          from: location,
        }}
        replace
      />
    );
  }

  // Se roles foram especificados, verificar permissão
  if (roles.length > 0) {
    // Admin sempre tem acesso
    if (adminStatus) {
      return children;
    }

    // Verificar se o role do usuário está na lista permitida
    if (!roles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Se autenticado e com permissão, renderizar o componente
  return children;
}

// Componente para rotas que só devem ser acessadas quando NÃO autenticado
export function PublicRoute({ children, redirectTo = '/dashboard' }) {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  // Se estiver autenticado, redirecionar para dashboard
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Se não autenticado, renderizar o componente (login, signup, etc.)
  return children;
}

// Componente para rotas que precisam de permissões específicas
export function RoleProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
  redirectTo = '/unauthorized',
}) {
  const { isAuthenticated, loading, hasPermission, isAdmin, user } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Verificando permissões...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
        }}
        replace
      />
    );
  }

  // Verificar se é admin (tem acesso a tudo)
  if (isAdmin()) {
    return children;
  }

  // Verificar role específico
  if (requiredRole && user?.user_metadata?.role !== requiredRole) {
    if (fallback) {
      return fallback;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Verificar permissão específica
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (fallback) {
      return fallback;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Se passou em todas as verificações, renderizar o componente
  return children;
}

// Componente específico para Recepcionista - redireciona para Lista da Vez
export function ReceptionistRoute({ children }) {
  const { isAuthenticated, loading, receptionistStatus } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Verificando permissões...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
        }}
        replace
      />
    );
  }

  // Se for Recepcionista, redirecionar para Lista da Vez
  if (receptionistStatus) {
    return <Navigate to="/queue" replace />;
  }

  // Se não for Recepcionista, renderizar o componente normalmente
  return children;
}

// Componente de fallback para acesso negado
export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-light-bg px-4 dark:bg-dark-bg">
      <div className="w-full max-w-md text-center">
        <div className="card-theme rounded-xl border border-light-border p-8 shadow-lg dark:border-dark-border">
          <div className="bg-danger mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
            <span className="text-dark-text-primary text-xl font-bold">!</span>
          </div>
          <h2 className="mb-4 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Acesso Negado
          </h2>
          <p className="mb-6 text-text-light-secondary dark:text-text-dark-secondary">
            Você não tem permissão para acessar esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-dark-text-primary hover:bg-primary-600 rounded-lg bg-primary px-6 py-3 transition-colors duration-300"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
