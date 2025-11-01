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
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${config.color}`}
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
      <div className="border-b border-light-border dark:border-dark-border pb-6">
        <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
          Meu Perfil
        </h1>
        <p className="text-text-light-secondary dark:text-text-dark-secondary mt-1">
          Gerencie suas informações pessoais e configurações de conta
        </p>
      </div>

      {/* Messages */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
          <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
          <p className="text-success font-medium">{success}</p>
        </div>
      )}

      {errors.general && (
        <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/20 rounded-lg">
          <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
          <p className="text-danger font-medium">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar Card */}
          <div className="card-theme rounded-xl border border-light-border dark:border-dark-border p-6">
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
              Foto do Perfil
            </h3>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {profileData.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-light-border dark:border-dark-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center border-2 border-light-border dark:border-dark-border">
                    <span className="text-dark-text-primary font-bold text-xl">
                      {getInitials(profileData.name || 'User')}
                    </span>
                  </div>
                )}
                <button className="absolute bottom-0 right-0 p-2 bg-primary hover:bg-primary-600 text-dark-text-primary rounded-full shadow-lg transition-colors duration-300">
                  <Camera size={16} />
                </button>
              </div>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary text-center">
                Clique no ícone da câmera para alterar sua foto
              </p>
            </div>
          </div>

          {/* Professional Info Card */}
          <div className="card-theme rounded-xl border border-light-border dark:border-dark-border p-6">
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
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
                <div className="flex items-center gap-2 mt-1">
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
                <div className="flex items-center gap-2 mt-1">
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
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    {professionalData.monthlyRevenue}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card-theme rounded-xl border border-light-border dark:border-dark-border p-6">
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-6">
              Informações Pessoais
            </h3>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                    className="w-full pl-10 pr-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                  </div>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-light-border/20 dark:bg-dark-border/20 border border-light-border dark:border-dark-border rounded-lg text-text-light-secondary dark:text-text-dark-secondary cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  O email não pode ser alterado por motivos de segurança
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
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
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-600 text-dark-text-primary rounded-lg font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-light-surface dark:border-dark-surface border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>

          {/* Password Change */}
          <div className="card-theme rounded-xl border border-light-border dark:border-dark-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                Alterar Senha
              </h3>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-light-border dark:border-dark-border text-text-light-primary dark:text-text-dark-primary rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors duration-300"
                >
                  <Lock size={16} />
                  Alterar Senha
                </button>
              )}
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                      className="w-full pl-10 pr-12 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                  <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                      className={`w-full pl-10 pr-12 py-3 bg-light-bg dark:bg-dark-bg border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary ${errors.newPassword ? 'border-danger' : 'border-light-border dark:border-dark-border'}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                      ) : (
                        <Eye className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-danger mt-1">
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                      className={`w-full pl-10 pr-12 py-3 bg-light-bg dark:bg-dark-bg border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary ${errors.confirmPassword ? 'border-danger' : 'border-light-border dark:border-dark-border'}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                      ) : (
                        <Eye className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-danger mt-1">
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
                    className="px-4 py-2 border border-light-border dark:border-dark-border text-text-light-primary dark:text-text-dark-primary rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-600 text-dark-text-primary rounded-lg font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-light-surface dark:border-dark-surface border-t-transparent rounded-full animate-spin" />
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
