import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, Loader2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const handleInputChange = e => {
    setEmail(e.target.value);
    if (error) setError('');
  };
  const validateForm = () => {
    if (!email) {
      setError('Email é obrigatório');
      return false;
    }
    if (!email.includes('@')) {
      setError('Email deve ter um formato válido');
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
      const { error: authError } = await resetPassword(email);
      if (authError) {
        setError(
          authError.message ||
            'Erro ao enviar email de recuperação. Tente novamente.'
        );
        return;
      }
      setSuccess(true);
    } catch {
      setError('Erro ao enviar email de recuperação. Tente novamente.');
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
              <CheckCircle className="text-dark-text-primary h-8 w-8" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Email enviado!
            </h2>
            <p className="mb-6 text-text-light-secondary dark:text-text-dark-secondary">
              Verifique sua caixa de entrada e siga as instruções para redefinir
              sua senha.
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="text-dark-text-primary hover:bg-primary-600 block w-full rounded-lg bg-primary px-6 py-3 transition-colors duration-300"
              >
                Voltar para Login
              </Link>
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="block w-full rounded-lg border border-light-border bg-light-bg px-6 py-3 text-text-light-primary transition-colors duration-300 hover:bg-light-surface dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:hover:bg-dark-surface"
              >
                Enviar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-light-bg px-4 dark:bg-dark-bg">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
            <span className="text-dark-text-primary text-xl font-bold">BA</span>
          </div>
          <h2 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Esqueceu sua senha?
          </h2>
          <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">
            Digite seu email para receber instruções de recuperação
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="card-theme rounded-xl border border-light-border p-8 shadow-lg dark:border-dark-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  value={email}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-light-border bg-light-bg py-3 pl-10 pr-3 text-text-light-primary placeholder-text-light-secondary transition-colors duration-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder-text-dark-secondary"
                  placeholder="seu@email.com"
                />
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
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Enviar instruções
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="hover:text-primary-600 inline-flex items-center gap-2 font-medium text-primary transition-colors duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para login
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-info/10 border-info/20 rounded-lg border p-4 text-center">
          <p className="text-info mb-2 font-medium">Precisa de ajuda?</p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Se você não receber o email em alguns minutos, verifique sua pasta
            de spam ou entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
}
