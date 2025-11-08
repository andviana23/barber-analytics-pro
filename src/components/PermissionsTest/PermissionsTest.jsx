import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Componente para testar o sistema de permissões
 * Este componente deve ser usado apenas em desenvolvimento
 */
const PermissionsTest = () => {
  const {
    user
  } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
  const [userUnitId, setUserUnitId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (user) {
      testPermissions();
    }
  }, [user]);
  const testPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Testar função get_user_role()
      const {
        data: roleData,
        error: roleError
      } = await supabase.rpc('get_user_role');
      if (roleError) throw roleError;
      setUserRole(roleData);

      // Testar função is_admin()
      const {
        data: adminData,
        error: adminError
      } = await supabase.rpc('is_admin');
      if (adminError) throw adminError;
      setIsAdmin(adminData);

      // Testar função is_manager_or_admin()
      const {
        data: managerData,
        error: managerError
      } = await supabase.rpc('is_manager_or_admin');
      if (managerError) throw managerError;
      setIsManagerOrAdmin(managerData);

      // Testar função get_user_unit_id()
      const {
        data: unitData,
        error: unitError
      } = await supabase.rpc('get_user_unit_id');
      if (unitError) throw unitError;
      setUserUnitId(unitData);
    } catch (err) {
      console.error('Erro ao testar permissões:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  if (!user) {
    return <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-yellow-800">
          ⚠️ Teste de Permissões
        </h3>
        <p className="text-yellow-700">
          Você precisa estar logado para testar as permissões.
        </p>
      </div>;
  }
  if (loading) {
    return <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-blue-800">
          🔄 Testando Permissões...
        </h3>
        <p className="text-blue-700">
          Aguarde enquanto testamos as funções de permissão.
        </p>
      </div>;
  }
  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-red-800">
          ❌ Erro no Teste de Permissões
        </h3>
        <p className="mb-4 text-red-700">{error}</p>
        <button onClick={testPermissions} className="text-dark-text-primary rounded bg-red-600 px-4 py-2 hover:bg-red-700">
          Tentar Novamente
        </button>
      </div>;
  }
  return <div className="rounded-lg border border-green-200 bg-green-50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-green-800">
        ✅ Teste de Permissões - Sistema Funcionando
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
            ID do Usuário:
          </span>
          <span className="card-theme rounded px-2 py-1 font-mono text-sm">
            {user.id}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
            Email:
          </span>
          <span className="card-theme rounded px-2 py-1 font-mono text-sm">
            {user.email}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
            Perfil (Role):
          </span>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${userRole === 'admin' ? 'bg-purple-100 text-purple-800' : userRole === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
            {userRole || 'barber'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
            É Admin:
          </span>
          <span className={`text-sm font-semibold ${isAdmin ? 'text-green-600' : 'text-gray-600'}`}>
            {isAdmin ? '✅ Sim' : '❌ Não'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
            É Manager ou Admin:
          </span>
          <span className={`text-sm font-semibold ${isManagerOrAdmin ? 'text-green-600' : 'text-gray-600'}`}>
            {isManagerOrAdmin ? '✅ Sim' : '❌ Não'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
            ID da Unidade:
          </span>
          <span className="card-theme rounded px-2 py-1 font-mono text-sm">
            {userUnitId || 'Não definido'}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-green-200 pt-4">
        <button onClick={testPermissions} className="text-dark-text-primary rounded bg-green-600 px-4 py-2 hover:bg-green-700">
          🔄 Testar Novamente
        </button>
      </div>
    </div>;
};
export default PermissionsTest;