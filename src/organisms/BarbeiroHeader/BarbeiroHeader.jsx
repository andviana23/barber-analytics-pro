import React from 'react';
import { Bell, MapPin, Sparkles } from 'lucide-react';
const BarbeiroHeader = React.memo(
  ({
    barberName = 'Barbeiro',
    unitName = 'Unidade não informada',
    greeting = 'Portal do Barbeiro',
    totalRevenue = 'R$\u00a00,00',
    totalRevenueLabel = 'Financeiro sincroniza em tempo real',
    points = 0,
    pointsLabel = 'Pontua\u00e7\u00e3o atualizada pela Lista da Vez',
    avatarInitials,
    notificationsBadge = 0,
    onNotificationsClick,
  }) => {
    const initials = React.useMemo(() => {
      if (avatarInitials) {
        return avatarInitials.toUpperCase().slice(0, 2);
      }
      return barberName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? '')
        .join('')
        .padEnd(2, 'B');
    }, [avatarInitials, barberName]);
    return (
      <header className="via-primary-dark to-primary-dark/90 text-dark-text-primary relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary shadow-xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="card-theme/10 absolute -top-20 right-0 h-56 w-56 rounded-full blur-3xl" />
          <div className="card-theme/10 absolute -bottom-12 left-16 h-32 w-32 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="card-theme/15 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-semibold uppercase backdrop-blur-sm sm:h-16 sm:w-16">
                {initials}
              </div>
              <div>
                <span className="text-dark-text-primary/70 text-xs font-medium uppercase tracking-[0.2em]">
                  {greeting}
                </span>
                <h1 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">
                  {barberName}
                </h1>
                <div className="card-theme/10 text-dark-text-primary/80 mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm backdrop-blur">
                  <MapPin size={16} strokeWidth={2.4} />
                  <span className="leading-none">{unitName}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onNotificationsClick}
              className="card-theme/10 text-dark-text-primary hover:card-theme/20 relative inline-flex h-12 w-12 items-center justify-center rounded-2xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              aria-label="Abrir notificações"
            >
              <Bell size={20} />
              {notificationsBadge > 0 ? (
                <span className="bg-danger text-dark-text-primary absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-semibold">
                  {notificationsBadge}
                </span>
              ) : null}
            </button>
          </div>

          <div className="text-dark-text-primary/90 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="card-theme/10 rounded-2xl border border-light-surface p-5 backdrop-blur dark:border-dark-surface/15">
              <p className="text-dark-text-primary/70 text-xs uppercase tracking-wide">
                Faturamento do m\u00eas
              </p>
              <p className="text-dark-text-primary mt-2 text-3xl font-semibold sm:text-4xl">
                {totalRevenue}
              </p>
              <span className="text-dark-text-primary/80 mt-3 inline-flex items-center gap-2 text-xs font-medium">
                <Sparkles size={16} strokeWidth={2.2} />
                {totalRevenueLabel}
              </span>
            </div>

            <div className="card-theme/5 rounded-2xl border border-light-surface p-5 backdrop-blur dark:border-dark-surface/10">
              <p className="text-dark-text-primary/70 text-xs uppercase tracking-wide">
                Pontua\u00e7\u00e3o
              </p>
              <p className="text-dark-text-primary mt-2 text-3xl font-semibold sm:text-4xl">
                {points}
              </p>
              <span className="text-dark-text-primary/75 mt-3 inline-block text-xs font-medium">
                {pointsLabel}
              </span>
            </div>
          </div>
        </div>
      </header>
    );
  }
);
BarbeiroHeader.displayName = 'BarbeiroHeader';
export default BarbeiroHeader;
