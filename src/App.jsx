import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { UnitProvider } from './context/UnitContext';
import { ProtectedRoute, PublicRoute, UnauthorizedPage } from './components/ProtectedRoute/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { useSkipLinks } from './utils/accessibility';

// Páginas públicas (não precisam de autenticação)
import { LoginPage } from './pages/LoginPage/LoginPage';
import { SignUpPage } from './pages/SignUpPage/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage';

// Páginas protegidas (precisam de autenticação)
import { DashboardPage } from './pages/DashboardPage/DashboardPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { UserManagementPage } from './pages/UserManagementPage';
import FinanceiroAdvancedPage from './pages/FinanceiroAdvancedPage/FinanceiroAdvancedPage';
import { BankAccountsPage } from './pages';
import { ListaDaVezPage } from './pages/ListaDaVezPage';
import { ProfessionalsPage } from './pages/ProfessionalsPage/ProfessionalsPage';
import UnitsPage from './pages/UnitsPage/UnitsPage';
import RelatoriosPage from './pages/RelatoriosPage/RelatoriosPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage/PaymentMethodsPage';
import TesteFase2Page from './pages/TesteFase2Page';

import './styles/index.css';

// Skip Links Component
function SkipLinks() {
  const { addSkipLink, removeSkipLink } = useSkipLinks();

  useEffect(() => {
    addSkipLink('main-content', 'Pular para o conteúdo principal');
    addSkipLink('sidebar-navigation', 'Pular para a navegação');
    
    return () => {
      removeSkipLink();
    };
  }, [addSkipLink, removeSkipLink]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <UnitProvider>
            <SkipLinks />
            <Router>
          <Routes>
            {/* Rota raiz - redireciona para dashboard se autenticado, senão para login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Rotas públicas - só acessíveis quando NÃO autenticado */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <SignUpPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              } 
            />

            {/* Rotas protegidas - só acessíveis quando autenticado */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="dashboard">
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Rotas futuras - já preparadas */}
            <Route 
              path="/financial" 
              element={
                <ProtectedRoute roles={['admin', 'gerente']}>
                  <FinanceiroAdvancedPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/financial/banks" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <Layout activeMenuItem="financial">
                    <BankAccountsPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/professionals" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="professionals">
                    <ProfessionalsPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/units" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="units">
                    <UnitsPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/queue" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="queue">
                    <ListaDaVezPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="reports">
                    <RelatoriosPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/units" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="units">
                    <UnitsPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Rotas de Cadastros */}
            <Route 
              path="/cadastros/formas-pagamento" 
              element={
                <ProtectedRoute roles={['admin', 'gerente']}>
                  <PaymentMethodsPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="profile">
                    <UserProfilePage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Rota de gerenciamento de usuários - apenas para Admins */}
            <Route 
              path="/user-management" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <Layout activeMenuItem="user-management">
                    <UserManagementPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="settings">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
                        Configurações
                      </h2>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">
                        Em desenvolvimento...
                      </p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Rota de acesso negado */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Rota 404 - página não encontrada */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg px-4">
                  <div className="max-w-md w-full text-center">
                    <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-xl border border-light-border dark:border-dark-border shadow-lg">
                      <div className="mx-auto w-16 h-16 bg-warning rounded-xl flex items-center justify-center mb-4">
                        <span className="text-white font-bold text-xl">404</span>
                      </div>
                      <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
                        Página não encontrada
                      </h2>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6">
                        A página que você está procurando não existe.
                      </p>
                      <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
                      >
                        Ir para Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              } 
            />

            {/* Rota de teste - Fase 2 */}
            <Route 
              path="/teste-fase-2" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <TesteFase2Page />
                </ProtectedRoute>
              } 
            />
          </Routes>
            </Router>
          </UnitProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
