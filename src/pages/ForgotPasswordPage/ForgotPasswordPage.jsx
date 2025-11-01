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
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg px-4">
        <div className="max-w-md w-full text-center">
          <div className="card-theme p-8 rounded-xl border border-light-border dark:border-dark-border shadow-lg">
            <div className="mx-auto w-16 h-16 bg-success rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="text-dark-text-primary h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
              Email enviado!
            </h2>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6">
              Verifique sua caixa de entrada e siga as instruções para redefinir
              sua senha.
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full px-6 py-3 bg-primary text-dark-text-primary rounded-lg hover:bg-primary-600 transition-colors duration-300"
              >
                Voltar para Login
              </Link>
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="block w-full px-6 py-3 bg-light-bg dark:bg-dark-bg text-text-light-primary dark:text-text-dark-primary rounded-lg border border-light-border dark:border-dark-border hover:bg-light-surface dark:hover:bg-dark-surface transition-colors duration-300"
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
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <span className="text-dark-text-primary font-bold text-xl">BA</span>
          </div>
          <h2 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Esqueceu sua senha?
          </h2>
          <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">
            Digite seu email para receber instruções de recuperação
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="card-theme p-8 rounded-xl border border-light-border dark:border-dark-border shadow-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                  className="block w-full pl-10 pr-3 py-3 border border-light-border dark:border-dark-border rounded-lg bg-light-bg dark:bg-dark-bg text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-300"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-dark-text-primary bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
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
              className="inline-flex items-center gap-2 text-primary hover:text-primary-600 font-medium transition-colors duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para login
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-info/10 border border-info/20 rounded-lg p-4 text-center">
          <p className="text-info font-medium mb-2">Precisa de ajuda?</p>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
            Se você não receber o email em alguns minutos, verifique sua pasta
            de spam ou entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
}
