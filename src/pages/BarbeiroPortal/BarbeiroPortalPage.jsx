import React from 'react';
import {
  CalendarCheck2,
  Clock,
  LineChart,
  Sparkles,
  Users2,
} from 'lucide-react';
import {
  BarbeiroBottomNav,
  BarbeiroHeader,
  BarbeiroStatsCard,
} from '../../organisms';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

const BarbeiroPortalPage = () => {
  const { user } = useAuth();

  const displayName = React.useMemo(() => {
    const metadata = user?.user_metadata ?? {};
    return (
      metadata.display_name ||
      metadata.name ||
      metadata.full_name ||
      user?.email ||
      'Profissional Barber Analytics'
    );
  }, [user]);

  const unitName = React.useMemo(() => {
    const metadata = user?.user_metadata ?? {};
    return (
      metadata.unit_name ||
      metadata.unitName ||
      metadata.default_unit ||
      'Unidade ainda não vinculada'
    );
  }, [user]);

  const stats = React.useMemo(
    () => [
      {
        key: 'monthlyRevenue',
        title: 'Faturamento do mês',
        value: formatCurrency(0),
        helper: 'Integração financeira em implementação',
        tone: 'primary',
        icon: Sparkles,
      },
      {
        key: 'servicesToday',
        title: 'Serviços do dia',
        value: '0',
        helper: 'Agenda sincroniza automaticamente',
        tone: 'info',
        icon: CalendarCheck2,
      },
      {
        key: 'averageTicket',
        title: 'Ticket médio',
        value: formatCurrency(0),
        helper: 'Últimos 30 dias',
        tone: 'success',
        icon: Users2,
      },
      {
        key: 'retentionRate',
        title: 'Clientes recorrentes',
        value: '0%',
        helper: 'Baseado nos últimos 90 dias',
        tone: 'warning',
        icon: LineChart,
      },
    ],
    []
  );

  const upcomingAppointments = React.useMemo(() => [], []);

  const highlightNotes = React.useMemo(
    () => [
      {
        id: 'queue-sync',
        title: 'Lista da vez sincronizada',
        description:
          'Atualize a finalização do atendimento para registrar pontos e posição automaticamente.',
      },
      {
        id: 'payments-visibility',
        title: 'Visão financeira centralizada',
        description:
          'Acompanhe comissões e repasses diretamente do portal assim que a integração estiver ativa.',
      },
      {
        id: 'agenda-ownership',
        title: 'Controle total da agenda',
        description:
          'Confirme e ajuste horários com poucos toques. As alterações refletem imediatamente para a recepção.',
      },
    ],
    []
  );

  return (
    <div className="relative min-h-screen bg-light-bg pb-28 dark:bg-dark-bg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-6 sm:px-6 lg:px-8">
        <BarbeiroHeader
          barberName={displayName}
          unitName={unitName}
          totalRevenue={formatCurrency(0)}
          totalRevenueLabel="Integração com Supabase em andamento"
          points={0}
          pointsLabel="Acompanhe sua evolução na Lista da Vez"
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(stat => (
            <BarbeiroStatsCard key={stat.key} {...stat} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-3xl border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                  Agenda do dia
                </h2>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Os atendimentos confirmados aparecerão aqui automaticamente.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                <CalendarCheck2 size={16} />
                Hoje
              </span>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-light-border bg-light-hover/60 p-8 text-center dark:border-dark-border dark:bg-dark-hover/60">
                <Clock className="mx-auto h-10 w-10 text-text-light-secondary dark:text-text-dark-secondary" />
                <p className="mt-4 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                  Integre sua agenda ou registre um atendimento manual para
                  visualizar os horários confirmados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map(slot => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-2xl border border-light-border bg-light-hover px-4 py-3 text-sm dark:border-dark-border dark:bg-dark-hover"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                        {slot.startsAt}
                      </span>
                      <span className="text-text-light-secondary dark:text-text-dark-secondary">
                        {slot.clientName} • {slot.service}
                      </span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                      {slot.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-3xl border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center gap-2">
              <Users2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                Insights rápidos
              </h2>
            </div>
            <ul className="space-y-3">
              {highlightNotes.map(note => (
                <li
                  key={note.id}
                  className="rounded-2xl border border-light-border bg-light-hover/80 p-4 text-left text-sm text-text-light-secondary dark:border-dark-border dark:bg-dark-hover/80 dark:text-text-dark-secondary"
                >
                  <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {note.title}
                  </p>
                  <p className="mt-1 leading-relaxed">{note.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <BarbeiroBottomNav />
    </div>
  );
};

export default BarbeiroPortalPage;
