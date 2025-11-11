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
  const [receptionistStatus, setReceptionistStatus] = useState(false);
  const [gerenteStatus, setGerenteStatus] = useState(false);

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
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

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
            const { data: refreshed, error: refreshError } =
              await supabase.auth.refreshSession();

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
    const fetchUserRole = async userSession => {
      // ✅ CRÍTICO: Se não tem sessão válida, retornar imediatamente
      if (!userSession?.user) {
        setAdminStatus(false);
        setUserRole(null);
        setGerenteStatus(false);
        setReceptionistStatus(false);
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
          setGerenteStatus(userRole === 'gerente');
          setReceptionistStatus(
            userRole === 'receptionist' || userRole === 'recepcionista'
          );
          return;
        }

        // 2. FALLBACK: Buscar na tabela professionals se não tem metadados
        console.log(
          '⚠️ Sem role nos metadados, buscando na tabela professionals...'
        );
        const { data: profData, error: profError } = await supabase
          .from('professionals')
          .select('role')
          .eq('user_id', userSession.user.id)
          .single();

        if (profError) {
          console.error(
            '❌ Erro ao buscar role na tabela professionals:',
            profError
          );
          // 🛡️ CORREÇÃO BUG-007: Removido email hardcoded - usuário deve ser configurado no sistema
          console.error(
            '❌ Usuário não configurado no sistema. Contate o administrador.'
          );
          setUserRole(null);
          setAdminStatus(false);
          // Opcionalmente, deslogar usuário não configurado
          // await signOut();
        } else if (profData?.role) {
          console.log(
            '✅ Role encontrado na tabela professionals:',
            profData.role
          );
          setUserRole(profData.role);
          setAdminStatus(profData.role === 'admin');
          setGerenteStatus(profData.role === 'gerente');
          setReceptionistStatus(
            profData.role === 'receptionist' ||
              profData.role === 'recepcionista'
          );
        } else {
          // 🛡️ CORREÇÃO BUG-007: Sem fallback inseguro - usuário deve estar configurado
          console.error('❌ Usuário não possui role configurado no sistema.');
          setUserRole(null);
          setAdminStatus(false);
          setReceptionistStatus(false);
        }
      } catch (err) {
        console.error('❌ Erro ao buscar role:', err);
        // 🛡️ CORREÇÃO BUG-007: Removido fallback inseguro - negar acesso em erro
        setUserRole(null);
        setAdminStatus(false);
        setReceptionistStatus(false);
      }
    };

    // Escutar mudanças de autenticação com logs detalhados
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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
          // ✅ CRÍTICO: Limpar TUDO imediatamente
          setSession(null);
          setUser(null);
          setUserRole(null);
          setAdminStatus(false);
          setGerenteStatus(false);
          setReceptionistStatus(false);
          setLoading(false);
          // ✅ CRÍTICO: Return para evitar finally
          return;
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
    });

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
          setGerenteStatus(userRole === 'gerente');
          setReceptionistStatus(
            userRole === 'receptionist' || userRole === 'recepcionista'
          );
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
    console.log('🔐 AUTH: Iniciando login...');
    console.log('📧 Email:', email);
    console.log('🌐 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

    try {
      setLoading(true);
      console.log('⏳ Estado loading ativado');

      // Adicionar timeout de 10 segundos para evitar travamento
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.error('⏱️ TIMEOUT! Login demorou mais de 10 segundos');
          reject(
            new Error(
              '⏱️ Timeout: A requisição demorou muito.\n\n' +
                '🔧 Possíveis causas:\n' +
                '1. CORS não configurado no Supabase\n' +
                '2. Problema de rede\n' +
                '3. Supabase fora do ar\n\n' +
                '📝 Solução:\n' +
                '1. Abra: https://supabase.com/dashboard/project/cwfrtqtienguzwsybvwm/settings/auth\n' +
                '2. Configure "Site URL": http://localhost:5173\n' +
                '3. Adicione em "Redirect URLs": http://localhost:5173/**\n' +
                '4. Salve e aguarde 30 segundos'
            )
          );
        }, 10000);
      });

      console.log('🚀 Enviando requisição de login para Supabase...');
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { data, error } = await Promise.race([
        signInPromise,
        timeoutPromise,
      ]);

      console.log('📬 Resposta recebida do Supabase');
      console.log('  Data:', data ? '✅ Presente' : '❌ Null');
      console.log('  Error:', error ? `❌ ${error.message}` : '✅ Nenhum');

      if (error) {
        console.error('❌ Erro no login:', error);
        throw error;
      }

      console.log('✅ Login bem-sucedido!');
      console.log('👤 Usuário:', data.user?.email);

      // TODO: Registrar login no sistema de auditoria (desabilitado temporariamente)
      // if (data.user) {
      //   auditService.logLogin({
      //     method: 'email',
      //     user_email: data.user.email
      //   });
      // }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Erro no signIn:', error);
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
      // ✅ CRÍTICO: Limpar estado ANTES de fazer logout
      // Isso evita race conditions com onAuthStateChange
      setSession(null);
      setUser(null);
      setUserRole(null);
      setAdminStatus(false);
      setGerenteStatus(false);
      setReceptionistStatus(false);
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
  const resetPassword = async email => {
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
  const updatePassword = async newPassword => {
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
  const updateProfile = async updates => {
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
  const hasPermission = permission => {
    if (!user) return false;

    // Se permission é um array, verificar se usuário tem alguma das permissões
    if (Array.isArray(permission)) {
      return permission.some(perm => hasPermission(perm));
    }

    // Verificar no campo 'role' (singular)
    if (user.user_metadata?.role === permission) {
      return true;
    }

    // Verificar no array 'permissions'
    if (user.user_metadata?.permissions?.includes(permission)) {
      return true;
    }

    return false;
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
    adminStatus,
    gerenteStatus,
    receptionistStatus,

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
