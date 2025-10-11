import React from 'react';
import { DollarSign, Users, Calendar, TrendingUp, Clock, Scissors } from 'lucide-react';

const kpiCards = [
  {
    title: 'Receita do Dia',
    value: 'R$ 2.450,00',
    change: '+15%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-success',
  },
  {
    title: 'Atendimentos',
    value: '42',
    change: '+8%',
    trend: 'up',
    icon: Users,
    color: 'text-primary',
  },
  {
    title: 'Agendamentos',
    value: '28',
    change: '+12%',
    trend: 'up',
    icon: Calendar,
    color: 'text-warning',
  },
  {
    title: 'Taxa Ocupação',
    value: '85%',
    change: '+3%',
    trend: 'up',
    icon: TrendingUp,
    color: 'text-info',
  },
];

const todayAppointments = [
  {
    id: 1,
    time: '09:00',
    client: 'João Silva',
    service: 'Corte + Barba',
    professional: 'Carlos',
    status: 'confirmed',
  },
  {
    id: 2,
    time: '10:30',
    client: 'Pedro Santos',
    service: 'Corte Simples',
    professional: 'André',
    status: 'in-progress',
  },
  {
    id: 3,
    time: '11:00',
    client: 'Maria Oliveira',
    service: 'Corte Feminino',
    professional: 'Larissa',
    status: 'waiting',
  },
  {
    id: 4,
    time: '14:00',
    client: 'Roberto Costa',
    service: 'Corte + Barba + Relaxamento',
    professional: 'Carlos',
    status: 'confirmed',
  },
];

const statusColors = {
  confirmed: 'bg-primary text-white',
  'in-progress': 'bg-warning text-dark',
  waiting: 'bg-info text-white',
  completed: 'bg-success text-white',
};

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-light-border dark:border-dark-border pb-6">
        <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
          Dashboard
        </h1>
        <p className="text-text-light-secondary dark:text-text-dark-secondary mt-1">
          Visão geral das atividades de hoje - {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="bg-light-surface dark:bg-dark-surface p-6 rounded-xl border border-light-border dark:border-dark-border"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-light-bg dark:bg-dark-bg ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-success text-sm font-medium flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {kpi.change}
                </span>
              </div>
              <div>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                  {kpi.title}
                </p>
                <p className="text-text-light-primary dark:text-text-dark-primary text-2xl font-bold mt-1">
                  {kpi.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border">
          <div className="p-6 border-b border-light-border dark:border-dark-border">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                Agendamentos de Hoje
              </h3>
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                {todayAppointments.length}
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-light-bg dark:bg-dark-bg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0" />
                    <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {appointment.time}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                      {appointment.client}
                    </p>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary truncate">
                      {appointment.service} • {appointment.professional}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${statusColors[appointment.status]}`}
                  >
                    {appointment.status === 'confirmed' && 'Confirmado'}
                    {appointment.status === 'in-progress' && 'Em Andamento'}
                    {appointment.status === 'waiting' && 'Aguardando'}
                    {appointment.status === 'completed' && 'Concluído'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border">
          <div className="p-6 border-b border-light-border dark:border-dark-border">
            <div className="flex items-center gap-3">
              <Scissors className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                Ações Rápidas
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 rounded-lg bg-primary text-white hover:bg-primary-600 transition-colors duration-300 text-center">
                <Users className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Novo Cliente</span>
              </button>
              <button className="p-4 rounded-lg bg-success text-white hover:bg-success-600 transition-colors duration-300 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Agendar</span>
              </button>
              <button className="p-4 rounded-lg bg-warning text-dark hover:bg-warning-600 transition-colors duration-300 text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Caixa</span>
              </button>
              <button className="p-4 rounded-lg bg-info text-white hover:bg-info-600 transition-colors duration-300 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Relatórios</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}