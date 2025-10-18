import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

// Componente para proteger rotas que precisam de autenticação
export function ProtectedRoute({ children, redirectTo = '/login' }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Se autenticado, renderizar o componente
  return children;
}

// Componente para rotas que só devem ser acessadas quando NÃO autenticado
export function PublicRoute({ children, redirectTo = '/dashboard' }) {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
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
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Verificando permissões...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Verificando permissões...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-xl border border-light-border dark:border-dark-border shadow-lg">
          <div className="mx-auto w-16 h-16 bg-danger rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">!</span>
          </div>
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
            Acesso Negado
          </h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
