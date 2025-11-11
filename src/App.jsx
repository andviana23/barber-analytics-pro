import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import {
  ProtectedRoute,
  PublicRoute,
  ReceptionistRoute,
  UnauthorizedPage,
} from './components/ProtectedRoute/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { UnitProvider } from './context/UnitContext';
import { useSkipLinks } from './utils/accessibility';

// Páginas públicas (não precisam de autenticação)
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { SignUpPage } from './pages/SignUpPage/SignUpPage';

// Páginas protegidas (precisam de autenticação)
import { CategoriesPage } from './pages';
import { BankAccountsPage } from './pages/BankAccountsPage'; // ✅ Bank accounts page import
import ClientsPage from './pages/ClientsPage'; // ✅ Clients page import
import { DashboardPage } from './pages/DashboardPage/DashboardPage';
import { DebugAuthPage } from './pages/DebugAuthPage'; // 🐛 Debug Auth page
import { DemonstrativoFluxoPage } from './pages/DemonstrativoFluxoPage';
import { DREPage } from './pages/DREPage';
import FinanceiroAdvancedPage from './pages/FinanceiroAdvancedPage/FinanceiroAdvancedPage';
import GoalsPage from './pages/GoalsPage';
import { ListaDaVezPage } from './pages/ListaDaVezPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage/PaymentMethodsPage';
import ProductsPage from './pages/ProductsPage/ProductsPage'; // ✅ Products page import
import { ProfessionalsPage } from './pages/ProfessionalsPage';
import RelatoriosPage from './pages/RelatoriosPage/RelatoriosPage';
import SuppliersPage from './pages/SuppliersPage/SuppliersPage';
import { TurnHistoryPage } from './pages/TurnHistoryPage';
import UnitsPage from './pages/UnitsPage/UnitsPage';
import CommissionsPage from './pages/CommissionsPage';
import { UserProfilePage } from './pages/UserProfilePage';

// Páginas do módulo de Caixa, Comandas e Serviços
import CashRegisterPage from './pages/CashRegisterPage';
import CommissionReportPage from './pages/CommissionReportPage';
import OrdersPage from './pages/OrdersPage';
import ServicesPage from './pages/ServicesPage';

// Página de Conciliação Bancária
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

// Criação do QueryClient para TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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

                  {/* 💰 Módulo Financeiro Avançado (Receitas, Despesas, Fluxo, Contas) */}
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

                  {/* 💰 Página de Comissões (Gestão Manual) */}
                  <Route
                    path="/commissions"
                    element={
                      <ReceptionistRoute>
                        <ProtectedRoute roles={['admin', 'gerente']}>
                          <Layout activeMenuItem="financial">
                            <CommissionsPage />
                          </Layout>
                        </ProtectedRoute>
                      </ReceptionistRoute>
                    }
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

                  <Route
                    path="/demonstrativo-fluxo"
                    element={
                      <ReceptionistRoute>
                        <ProtectedRoute roles={['admin', 'gerente']}>
                          <Layout activeMenuItem="demonstrativo-fluxo">
                            <DemonstrativoFluxoPage />
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
                          <div className="py-12 text-center">
                            <h2 className="mb-4 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
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
                      <div className="flex min-h-screen items-center justify-center bg-light-bg px-4 dark:bg-dark-bg">
                        <div className="w-full max-w-md text-center">
                          <div className="card-theme rounded-xl border border-light-border p-8 shadow-lg dark:border-dark-border">
                            <div className="bg-warning mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
                              <span className="text-dark-text-primary text-xl font-bold">
                                404
                              </span>
                            </div>
                            <h2 className="mb-4 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                              Página não encontrada
                            </h2>
                            <p className="mb-6 text-text-light-secondary dark:text-text-dark-secondary">
                              A página que você está procurando não existe.
                            </p>
                            <button
                              onClick={() =>
                                (window.location.href = '/dashboard')
                              }
                              className="text-dark-text-primary hover:bg-primary-600 rounded-lg bg-primary px-6 py-3 transition-colors duration-300"
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
    </QueryClientProvider>
  );
}
export default App;
