import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, UserPlus, Loader2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export function SignUpPage() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
    if (!formData.fullName.trim()) {
      setError('Nome completo é obrigatório');
      return false;
    }
    if (formData.fullName.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return false;
    }
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
    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
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
      const { data, error: authError } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName,
        }
      );
      if (authError) {
        setError(authError.message || 'Erro ao criar conta. Tente novamente.');
        return;
      }
      if (data?.user) {
        setSuccess(true);
      }
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-bg px-4 dark:bg-dark-bg">
        <div className="w-full max-w-md text-center">
          <div className="card-theme rounded-xl border border-light-border p-8 shadow-lg dark:border-dark-border">
            <div className="bg-success mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
              <UserPlus className="text-dark-text-primary h-8 w-8" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Conta criada com sucesso!
            </h2>
            <p className="mb-6 text-text-light-secondary dark:text-text-dark-secondary">
              Verifique seu email para confirmar sua conta antes de fazer login.
            </p>
            <Link
              to="/login"
              className="text-dark-text-primary hover:bg-primary-600 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 transition-colors duration-300"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-light-bg px-4 py-8 dark:bg-dark-bg">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
            <span className="text-dark-text-primary text-xl font-bold">BA</span>
          </div>
          <h2 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Criar sua conta
          </h2>
          <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">
            Junte-se ao Barber Analytics Pro
          </p>
        </div>

        {/* SignUp Form */}
        <div className="card-theme rounded-xl border border-light-border p-8 shadow-lg dark:border-dark-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
              >
                Nome Completo
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-light-border bg-light-bg py-3 pl-10 pr-3 text-text-light-primary placeholder-text-light-secondary transition-colors duration-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder-text-dark-secondary"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
              >
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-light-border bg-light-bg py-3 pl-10 pr-3 text-text-light-primary placeholder-text-light-secondary transition-colors duration-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder-text-dark-secondary"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
              >
                Senha
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-light-border bg-light-bg py-3 pl-10 pr-12 text-text-light-primary placeholder-text-light-secondary transition-colors duration-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder-text-dark-secondary"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-text-light-secondary transition-colors duration-300 hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary" />
                  ) : (
                    <Eye className="h-5 w-5 text-text-light-secondary transition-colors duration-300 hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-light-border bg-light-bg py-3 pl-10 pr-12 text-text-light-primary placeholder-text-light-secondary transition-colors duration-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder-text-dark-secondary"
                  placeholder="Confirme sua senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-text-light-secondary transition-colors duration-300 hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary" />
                  ) : (
                    <Eye className="h-5 w-5 text-text-light-secondary transition-colors duration-300 hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-danger/10 border-danger/20 rounded-lg border p-3">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="text-dark-text-primary hover:bg-primary-600 flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-4 py-3 text-sm font-medium shadow-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Criar conta
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="hover:text-primary-600 font-medium text-primary transition-colors duration-300"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        {/* Terms Notice */}
        <div className="text-center">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            Ao criar uma conta, você concorda com nossos{' '}
            <Link
              to="/terms"
              className="hover:text-primary-600 text-primary transition-colors duration-300"
            >
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link
              to="/privacy"
              className="hover:text-primary-600 text-primary transition-colors duration-300"
            >
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
