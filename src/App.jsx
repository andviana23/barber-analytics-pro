import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute, UnauthorizedPage } from './components/ProtectedRoute/ProtectedRoute';
import { Layout } from './components/Layout/Layout';

// Páginas públicas (não precisam de autenticação)
import { LoginPage } from './pages/LoginPage/LoginPage';
import { SignUpPage } from './pages/SignUpPage/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage';

// Páginas protegidas (precisam de autenticação)
import { DashboardPage } from './pages/DashboardPage/DashboardPage';

import './styles/index.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
                <ProtectedRoute>
                  <Layout activeMenuItem="financial">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
                        Módulo Financeiro
                      </h2>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">
                        Em desenvolvimento...
                      </p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/professionals" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="professionals">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
                        Profissionais
                      </h2>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">
                        Em desenvolvimento...
                      </p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/queue" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="queue">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
                        Lista da Vez
                      </h2>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">
                        Em desenvolvimento...
                      </p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="reports">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
                        Relatórios
                      </h2>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">
                        Em desenvolvimento...
                      </p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/units" 
              element={
                <ProtectedRoute>
                  <Layout activeMenuItem="units">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
                        Unidades
                      </h2>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">
                        Em desenvolvimento...
                      </p>
                    </div>
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
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
