import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
// import auditService from '../services/auditService'; // Desabilitado temporariamente

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
  const [userRole, setUserRole] = useState(null);
  const [adminStatus, setAdminStatus] = useState(false);

  // Timeout de segurança para loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 10000); // 10 segundos máximo de loading

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Obter sessão inicial com refresh forçado
    const getInitialSession = async () => {
      try {
        setLoading(true);
        
        // 1. Tentar obter sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão inicial:', error);
          setSession(null);
          setUser(null);
          return;
        }
        
        // 2. Se há sessão, verificar se token precisa refresh
        if (session?.user) {
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = session.expires_at || 0;
          
          // Se token expira em menos de 5 minutos, fazer refresh
          if (expiresAt - now < 300) {
            console.log('🔄 Token próximo do vencimento, fazendo refresh...');
            const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('❌ Erro no refresh da sessão:', refreshError);
            } else if (refreshed.session) {
              console.log('✅ Sessão refreshed com sucesso');
              setSession(refreshed.session);
              setUser(refreshed.session.user);
              await fetchUserRole(refreshed.session);
              return;
            }
          }
          
          // 3. Usar sessão atual
          setSession(session);
          setUser(session.user);
          
          // Se há usuário, buscar role
          if (session.user) {
            await fetchUserRole(session);
          }
        }
      } catch (err) {
        console.error('Erro ao inicializar auth:', err);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Função para buscar papel do usuário
    const fetchUserRole = async (userSession) => {
      if (!userSession?.user) {
        setAdminStatus(false);
        setUserRole(null);
        return;
      }
      
      console.log('🔍 Buscando role do usuário:', userSession.user.email);
      console.log('📋 User metadata:', userSession.user.user_metadata);
      
      try {
        // 1. PRIMEIRO: Usar metadados do usuário (mais confiável)
        const userRole = userSession.user?.user_metadata?.role;
        
        if (userRole) {
          console.log('✅ Role encontrado nos metadados:', userRole);
          setUserRole(userRole);
          setAdminStatus(userRole === 'admin');
          return;
        }
        
        // 2. FALLBACK: Buscar na tabela professionals se não tem metadados
        console.log('⚠️ Sem role nos metadados, buscando na tabela professionals...');
        const { data: profData, error: profError } = await supabase
          .from('professionals')
          .select('role')
          .eq('user_id', userSession.user.id)
          .single();
        
        if (profError) {
          console.error('❌ Erro ao buscar role na tabela professionals:', profError);
          // Se não conseguir buscar, usar role padrão baseado no email
          const defaultRole = userSession.user.email === 'andrey@tratodebarbados.com' ? 'admin' : 'barbeiro';
          setUserRole(defaultRole);
          setAdminStatus(defaultRole === 'admin');
        } else if (profData?.role) {
          console.log('✅ Role encontrado na tabela professionals:', profData.role);
          setUserRole(profData.role);
          setAdminStatus(profData.role === 'admin');
        } else {
          console.log('⚠️ Nenhum role encontrado, usando padrão');
          setUserRole('barbeiro');
          setAdminStatus(false);
        }
        
      } catch (err) {
        console.error('❌ Erro ao buscar role:', err);
        // Fallback final para metadados do usuário ou padrão
        const userRole = userSession.user?.user_metadata?.role || 'barbeiro';
        setUserRole(userRole);
        setAdminStatus(userRole === 'admin');
      }
    };

    // Escutar mudanças de autenticação com logs detalhados
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth State Change:', event, 'Session exists:', !!session);
        
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('✅ User authenticated, updating state...');
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
              await fetchUserRole(session);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out, clearing state...');
            setSession(null);
            setUser(null);
            setUserRole(null);
            setAdminStatus(false);
          } else if (event === 'INITIAL_SESSION') {
            console.log('🚀 Initial session loaded');
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
              await fetchUserRole(session);
            }
          }
          
          // Para eventos que não têm usuário
          if (!session?.user && event !== 'SIGNED_OUT') {
            setAdminStatus(false);
            setUserRole(null);
          }
        } catch (error) {
          // Erro na mudança de estado de autenticação
          setSession(null);
          setUser(null);
          setAdminStatus(false);
          setUserRole(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Função para forçar refresh da sessão
  const forceSessionRefresh = async () => {
    try {
      setLoading(true);
      console.log('🔄 Forçando refresh da sessão...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Erro no refresh forçado:', error);
        return false;
      }
      
      if (data.session) {
        console.log('✅ Sessão refreshed com sucesso');
        setSession(data.session);
        setUser(data.session.user);
        // Usar a função local fetchUserRole em vez de chamar diretamente
        // Buscar role manualmente aqui
        const userRole = data.session.user?.user_metadata?.role;
        if (userRole) {
          setUserRole(userRole);
          setAdminStatus(userRole === 'admin');
        }
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('❌ Erro ao forçar refresh:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

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

      // TODO: Registrar login no sistema de auditoria (desabilitado temporariamente)
      // if (data.user) {
      //   auditService.logLogin({
      //     method: 'email',
      //     user_email: data.user.email
      //   });
      // }

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
      
      // TODO: Registrar logout no sistema de auditoria (desabilitado temporariamente)
      // await auditService.logLogout();
      
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
    return adminStatus;
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
    userRole,
    
    // Funções de autenticação
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    forceSessionRefresh,
    
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