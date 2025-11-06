import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Camera,
  Save,
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Calendar,
  DollarSign,
  Scissors,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
export function UserProfilePage() {
  const { user, updateProfile, updatePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    avatar_url: user?.user_metadata?.avatar_url || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  // Simular dados do perfil profissional (será integrado com Supabase depois)
  const professionalData = {
    role: user?.user_metadata?.role || 'usuario',
    unit: user?.user_metadata?.unit || 'Mangabeiras',
    commission: user?.user_metadata?.commission || '40%',
    joinDate: user?.created_at
      ? new Date(user.created_at).toLocaleDateString('pt-BR')
      : 'N/A',
    totalServices: 156,
    monthlyRevenue: 'R$ 4.500,00',
  };
  const handleProfileUpdate = async e => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');
    try {
      const { error } = await updateProfile({
        data: {
          full_name: profileData.name,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
        },
      });
      if (error) {
        throw error;
      }
      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({
        general: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  const handlePasswordChange = async e => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    // Validações
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({
        confirmPassword: 'As senhas não coincidem',
      });
      setLoading(false);
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setErrors({
        newPassword: 'A senha deve ter pelo menos 6 caracteres',
      });
      setLoading(false);
      return;
    }
    try {
      const { error } = await updatePassword(passwordData.newPassword);
      if (error) {
        throw error;
      }
      setSuccess('Senha alterada com sucesso!');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({
        general: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  const getRoleBadge = role => {
    const roleConfig = {
      admin: {
        label: 'Administrador',
        color: 'bg-danger/10 text-danger border-danger/20',
        icon: Shield,
      },
      gerente: {
        label: 'Gerente',
        color: 'bg-warning/10 text-warning border-warning/20',
        icon: Building2,
      },
      barbeiro: {
        label: 'Barbeiro',
        color: 'bg-success/10 text-success border-success/20',
        icon: Scissors,
      },
      recepcionista: {
        label: 'Recepcionista',
        color: 'bg-info/10 text-info border-info/20',
        icon: User,
      },
      usuario: {
        label: 'Usuário',
        color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        icon: User,
      },
    };
    const config = roleConfig[role] || roleConfig.usuario;
    const IconComponent = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${config.color}`}
      >
        <IconComponent size={14} />
        {config.label}
      </span>
    );
  };
  const getInitials = name => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-light-border pb-6 dark:border-dark-border">
        <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
          Meu Perfil
        </h1>
        <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary">
          Gerencie suas informações pessoais e configurações de conta
        </p>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-success/10 border-success/20 flex items-center gap-3 rounded-lg border p-4">
          <CheckCircle className="text-success h-5 w-5 flex-shrink-0" />
          <p className="text-success font-medium">{success}</p>
        </div>
      )}

      {errors.general && (
        <div className="bg-danger/10 border-danger/20 flex items-center gap-3 rounded-lg border p-4">
          <AlertCircle className="text-danger h-5 w-5 flex-shrink-0" />
          <p className="text-danger font-medium">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Picture & Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Avatar Card */}
          <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border">
            <h3 className="mb-4 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Foto do Perfil
            </h3>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {profileData.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Profile"
                    className="h-24 w-24 rounded-full border-2 border-light-border object-cover dark:border-dark-border"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-light-border bg-primary dark:border-dark-border">
                    <span className="text-dark-text-primary text-xl font-bold">
                      {getInitials(profileData.name || 'User')}
                    </span>
                  </div>
                )}
                <button className="hover:bg-primary-600 text-dark-text-primary absolute bottom-0 right-0 rounded-full bg-primary p-2 shadow-lg transition-colors duration-300">
                  <Camera size={16} />
                </button>
              </div>
              <p className="text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Clique no ícone da câmera para alterar sua foto
              </p>
            </div>
          </div>

          {/* Professional Info Card */}
          <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border">
            <h3 className="mb-4 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Informações Profissionais
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Perfil
                </label>
                <div className="mt-1">
                  {getRoleBadge(professionalData.role)}
                </div>
              </div>

              <div>
                <label className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Unidade
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
                  <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    {professionalData.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Data de Entrada
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
                  <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    {professionalData.joinDate}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Faturamento do Mês
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <DollarSign className="text-success h-4 w-4" />
                  <span className="text-success text-sm font-medium">
                    {professionalData.monthlyRevenue}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Information */}
          <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border">
            <h3 className="mb-6 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Informações Pessoais
            </h3>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                  </div>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={e =>
                      setProfileData({
                        ...profileData,
                        name: e.target.value,
                      })
                    }
                    placeholder="Seu nome completo"
                    className="w-full rounded-lg border border-light-border bg-light-bg py-3 pl-10 pr-4 text-text-light-primary transition-colors duration-300 placeholder:text-text-light-secondary focus:border-transparent focus:ring-2 focus:ring-primary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  E-mail
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                  </div>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-light-border bg-light-border/20 py-3 pl-10 pr-4 text-text-light-secondary dark:border-dark-border dark:bg-dark-border/20 dark:text-text-dark-secondary"
                  />
                </div>
                <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  O email não pode ser alterado por motivos de segurança
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={e =>
                    setProfileData({
                      ...profileData,
                      phone: e.target.value,
                    })
                  }
                  placeholder="(31) 99999-9999"
                  className="w-full rounded-lg border border-light-border bg-light-bg px-4 py-3 text-text-light-primary transition-colors duration-300 placeholder:text-text-light-secondary focus:border-transparent focus:ring-2 focus:ring-primary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="hover:bg-primary-600 text-dark-text-primary flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                  ) : (
                    <Save size={16} />
                  )}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>

          {/* Password Change */}
          <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                Alterar Senha
              </h3>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center gap-2 rounded-lg border border-light-border px-4 py-2 text-text-light-primary transition-colors duration-300 hover:bg-light-bg dark:border-dark-border dark:text-text-dark-primary dark:hover:bg-dark-bg"
                >
                  <Lock size={16} />
                  Alterar Senha
                </button>
              )}
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={e =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="Digite sua senha atual"
                      className="w-full rounded-lg border border-light-border bg-light-bg py-3 pl-10 pr-12 text-text-light-primary transition-colors duration-300 placeholder:text-text-light-secondary focus:border-transparent focus:ring-2 focus:ring-primary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                      ) : (
                        <Eye className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={e =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Digite a nova senha"
                      className={`w-full rounded-lg border bg-light-bg py-3 pl-10 pr-12 text-text-light-primary transition-colors duration-300 placeholder:text-text-light-secondary focus:border-transparent focus:ring-2 focus:ring-primary dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary ${errors.newPassword ? 'border-danger' : 'border-light-border dark:border-dark-border'}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                      ) : (
                        <Eye className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-danger mt-1 text-sm">
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={e =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirme a nova senha"
                      className={`w-full rounded-lg border bg-light-bg py-3 pl-10 pr-12 text-text-light-primary transition-colors duration-300 placeholder:text-text-light-secondary focus:border-transparent focus:ring-2 focus:ring-primary dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary ${errors.confirmPassword ? 'border-danger' : 'border-light-border dark:border-dark-border'}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                      ) : (
                        <Eye className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-danger mt-1 text-sm">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setErrors({});
                    }}
                    className="rounded-lg border border-light-border px-4 py-2 text-text-light-primary transition-colors duration-300 hover:bg-light-bg dark:border-dark-border dark:text-text-dark-primary dark:hover:bg-dark-bg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="hover:bg-primary-600 text-dark-text-primary flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                    ) : (
                      <Save size={16} />
                    )}
                    Alterar Senha
                  </button>
                </div>
              </form>
            )}

            {!showPasswordForm && (
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Mantenha sua conta segura alterando sua senha regularmente
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
