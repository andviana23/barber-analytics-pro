import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/secureLogger';
export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro quando usuário começar a digitar
    if (error) setError('');
  };
  const validateForm = () => {
    if (!formData.email) {
      setError('Email é obrigatório');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Email deve ter um formato válido');
      return false;
    }
    if (!formData.password) {
      setError('Senha é obrigatória');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    return true;
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setError('');
    try {
      // 🛡️ CORREÇÃO BUG-002: Log sanitizado de autenticação
      logger.auth('Tentativa de login', {
        email: formData.email,
      });
      const { data, error: authError } = await signIn(
        formData.email,
        formData.password
      );
      logger.auth('Resultado do login', {
        success: !authError,
        hasData: !!data,
      });
      if (authError) {
        logger.error('Erro de autenticação', authError);

        // Mensagens de erro mais específicas
        let errorMessage = 'Email ou senha incorretos';
        if (authError.message?.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos';
        } else if (authError.message?.includes('Email not confirmed')) {
          errorMessage =
            'Email não confirmado. Verifique sua caixa de entrada.';
        } else if (authError.message?.includes('Too many requests')) {
          errorMessage =
            'Muitas tentativas. Tente novamente em alguns minutos.';
        } else if (authError.message) {
          errorMessage = authError.message;
        }
        setError(errorMessage);
        return;
      }
      if (data?.user) {
        logger.success('Login realizado com sucesso');
        // Sucesso - redirecionar para dashboard
        navigate('/dashboard');
      } else {
        setError('Erro inesperado no login. Tente novamente.');
      }
    } catch (err) {
      logger.error('Erro crítico no login', err);
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-light-bg via-light-surface to-light-bg px-4 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 animate-pulse rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-primary/5 blur-3xl delay-1000" />
      </div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md space-y-4">
        {/* Header with Logo */}
        <div className="animate-fade-in-down text-center">
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <img
              src="/logo.svg"
              alt="Barber Analytics Pro"
              className="h-32 w-auto object-contain sm:h-36"
              onError={e => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            {/* Fallback Logo */}
            <div className="hidden items-center justify-center">
              <Sparkles className="h-28 w-28 text-primary" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-theme-primary mb-1.5 text-xl font-bold tracking-tight sm:text-2xl">
            Bem-vindo de volta
          </h1>
          <p className="text-theme-secondary text-xs">
            Faça login para acessar sua conta
          </p>
        </div>

        {/* Login Form Card */}
        <div className="card-theme animate-fade-in-up rounded-2xl border shadow-2xl">
          <div className="space-y-4 p-5 sm:p-6">
            <form className="space-y-3.5" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-theme-primary block text-xs font-semibold"
                >
                  Email
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="text-theme-secondary h-4 w-4 transition-colors duration-200 group-focus-within:text-primary" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-theme h-10 pl-10 text-sm transition-all duration-200"
                    placeholder="seu@email.com"
                    data-testid="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-theme-primary block text-xs font-semibold"
                >
                  Senha
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="text-theme-secondary h-4 w-4 transition-colors duration-200 group-focus-within:text-primary" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input-theme h-10 pl-10 pr-10 text-sm transition-all duration-200"
                    placeholder="••••••••"
                    data-testid="password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 transition-transform duration-200 hover:scale-110"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="text-theme-secondary hover:text-theme-primary h-4 w-4 transition-colors duration-200" />
                    ) : (
                      <Eye className="text-theme-secondary hover:text-theme-primary h-4 w-4 transition-colors duration-200" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="animate-shake rounded-lg border border-feedback-light-error/30 bg-feedback-light-error/10 p-2.5 dark:border-feedback-dark-error/30 dark:bg-feedback-dark-error/10">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">
                      <svg
                        className="h-4 w-4 text-feedback-light-error dark:text-feedback-dark-error"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-feedback-light-error dark:text-feedback-dark-error">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary transition-colors duration-200 hover:text-primary-hover hover:underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-theme-primary h-10 w-full transform rounded-lg text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                data-testid="submit-login"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Entrando...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>Entrar</span>
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-light-border dark:border-dark-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="card-theme text-theme-secondary px-2 font-medium">
                  OU
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-theme-secondary text-xs">
                Não tem uma conta?{' '}
                <Link
                  to="/signup"
                  className="font-semibold text-primary transition-colors duration-200 hover:text-primary-hover hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-theme-secondary/70 animate-fade-in text-center text-[10px]">
          <p>© 2025 Barber Analytics Pro</p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out 0.2s both;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out 0.4s both;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
