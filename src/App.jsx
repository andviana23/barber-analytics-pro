import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { UnitProvider } from './context/UnitContext';
import {
  ProtectedRoute,
  PublicRoute,
  UnauthorizedPage,
  ReceptionistRoute,
} from './components/ProtectedRoute/ProtectedRoute';
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
import { CategoriesPage } from './pages';
import GoalsPage from './pages/GoalsPage';
import { ListaDaVezPage } from './pages/ListaDaVezPage';
import { TurnHistoryPage } from './pages/TurnHistoryPage';
import { ProfessionalsPage } from './pages/ProfessionalsPage';
import UnitsPage from './pages/UnitsPage/UnitsPage';
import RelatoriosPage from './pages/RelatoriosPage/RelatoriosPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage/PaymentMethodsPage';
import SuppliersPage from './pages/SuppliersPage/SuppliersPage';
import ClientsPage from './pages/ClientsPage'; // ✅ Clients page import
import ProductsPage from './pages/ProductsPage/ProductsPage'; // ✅ Products page import
import { DREPage } from './pages/DREPage';
import { BankAccountsPage } from './pages/BankAccountsPage'; // ✅ Bank accounts page import
import { DebugAuthPage } from './pages/DebugAuthPage'; // 🐛 Debug Auth page

// Páginas do módulo de Caixa, Comandas e Serviços
import CashRegisterPage from './pages/CashRegisterPage';
import OrdersPage from './pages/OrdersPage';
import ServicesPage from './pages/ServicesPage';
import CommissionReportPage from './pages/CommissionReportPage';

// Página de Conciliação Bancária
import { ConciliacaoPage } from './pages/ConciliacaoPage';
import { BarbeiroPortalPage } from './pages/BarbeiroPortal';

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
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />

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
                    <ReceptionistRoute>
                      <ProtectedRoute>
                        <Layout activeMenuItem="dashboard">
                          <DashboardPage />
                        </Layout>
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                <Route
                  path="/barbeiro/portal"
                  element={
                    <ProtectedRoute roles={['barbeiro']}>
                      <BarbeiroPortalPage />
                    </ProtectedRoute>
                  }
                />

                {/* Rotas futuras - já preparadas */}
                <Route
                  path="/financial"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin', 'gerente']}>
                        <FinanceiroAdvancedPage />
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                {/* Alias para compatibilidade com testes E2E */}
                <Route
                  path="/financeiro"
                  element={<Navigate to="/financial" replace />}
                />

                <Route
                  path="/professionals"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin']}>
                        <Layout activeMenuItem="professionals">
                          <ProfessionalsPage />
                        </Layout>
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                <Route
                  path="/units"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin']}>
                        <Layout activeMenuItem="units">
                          <UnitsPage />
                        </Layout>
                      </ProtectedRoute>
                    </ReceptionistRoute>
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

                {/* Alias para compatibilidade com testes E2E */}
                <Route
                  path="/lista-da-vez"
                  element={<Navigate to="/queue" replace />}
                />

                <Route
                  path="/queue/history"
                  element={
                    <ProtectedRoute>
                      <Layout activeMenuItem="queue">
                        <TurnHistoryPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/reports"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin']}>
                        <Layout activeMenuItem="reports">
                          <RelatoriosPage />
                        </Layout>
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                <Route
                  path="/dre"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin', 'gerente']}>
                        <Layout activeMenuItem="dre">
                          <DREPage />
                        </Layout>
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                {/* Rotas de Cadastros */}
                <Route
                  path="/cadastros/categorias"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin', 'gerente']}>
                        <CategoriesPage />
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                <Route
                  path="/cadastros/formas-pagamento"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin']}>
                        <PaymentMethodsPage />
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                <Route
                  path="/cadastros/fornecedores"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin', 'gerente']}>
                        <SuppliersPage />
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                <Route
                  path="/cadastros/clientes"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin', 'gerente']}>
                        <ClientsPage />
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                <Route
                  path="/cadastros/produtos"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin']}>
                        <ProductsPage />
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                <Route
                  path="/financeiro/contas-bancarias"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin']}>
                        <Layout activeMenuItem="financial">
                          <BankAccountsPage />
                        </Layout>
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                <Route
                  path="/cadastros/metas"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin', 'gerente']}>
                        <Layout activeMenuItem="cadastros">
                          <GoalsPage />
                        </Layout>
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                {/* Rotas do Módulo de Caixa, Comandas e Serviços */}
                <Route
                  path="/caixa"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute
                        roles={['admin', 'gerente', 'recepcionista']}
                      >
                        <Layout activeMenuItem="caixa">
                          <CashRegisterPage />
                        </Layout>
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                <Route
                  path="/comandas"
                  element={
                    <ProtectedRoute>
                      <Layout activeMenuItem="comandas">
                        <OrdersPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/servicos"
                  element={
                    <ProtectedRoute>
                      <Layout activeMenuItem="servicos">
                        <ServicesPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/comissoes"
                  element={
                    <ProtectedRoute>
                      <Layout activeMenuItem="comissoes">
                        <CommissionReportPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute>
                        <Layout activeMenuItem="profile">
                          <UserProfilePage />
                        </Layout>
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                {/* Rota de gerenciamento de usuários - apenas para Admins */}
                <Route
                  path="/user-management"
                  element={
                    <ReceptionistRoute>
                      <ProtectedRoute roles={['admin']}>
                        <Layout activeMenuItem="user-management">
                          <ProfessionalsPage />
                        </Layout>
                      </ProtectedRoute>
                    </ReceptionistRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute roles={['admin']}>
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

                {/* 🐛 Rota de Debug de Autenticação */}
                <Route
                  path="/debug/auth"
                  element={
                    <ProtectedRoute>
                      <DebugAuthPage />
                    </ProtectedRoute>
                  }
                />

                {/* Rota 404 - página não encontrada */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg px-4">
                      <div className="max-w-md w-full text-center">
                        <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-xl border border-light-border dark:border-dark-border shadow-lg">
                          <div className="mx-auto w-16 h-16 bg-warning rounded-xl flex items-center justify-center mb-4">
                            <span className="text-white font-bold text-xl">
                              404
                            </span>
                          </div>
                          <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
                            Página não encontrada
                          </h2>
                          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6">
                            A página que você está procurando não existe.
                          </p>
                          <button
                            onClick={() =>
                              (window.location.href = '/dashboard')
                            }
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
                          >
                            Ir para Dashboard
                          </button>
                        </div>
                      </div>
                    </div>
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
