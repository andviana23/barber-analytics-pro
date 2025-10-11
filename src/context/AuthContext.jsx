import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

// Criar o contexto
const AuthContext = createContext({});

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Provider do contexto
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Erro ao obter sessão inicial
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch {
        // Erro ao inicializar auth
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Função de login
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Função de cadastro
  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Função de reset de senha
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Função para atualizar senha
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Função para atualizar perfil
  const updateProfile = async (updates) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Verificar se usuário está autenticado
  const isAuthenticated = !!user;

  // Verificar se usuário tem permissão específica
  const hasPermission = (permission) => {
    // Implementar lógica de permissões baseada em roles
    // Por exemplo, verificar se user.user_metadata.role inclui a permissão
    return user?.user_metadata?.roles?.includes(permission) || false;
  };

  // Verificar se é admin
  const isAdmin = () => {
    return user?.user_metadata?.role === 'admin' || false;
  };

  // Obter dados do perfil do usuário
  const getUserProfile = () => {
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || '',
      avatarUrl: user.user_metadata?.avatar_url || '',
      role: user.user_metadata?.role || 'user',
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
    };
  };

  const value = {
    // Estado
    user,
    session,
    loading,
    isAuthenticated,
    
    // Funções de autenticação
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    
    // Funções utilitárias
    hasPermission,
    isAdmin,
    getUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}