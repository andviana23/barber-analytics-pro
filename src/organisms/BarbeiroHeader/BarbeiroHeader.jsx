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
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-primary-dark/90 text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 left-16 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-semibold uppercase backdrop-blur-sm sm:h-16 sm:w-16">
                {initials}
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                  {greeting}
                </span>
                <h1 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">
                  {barberName}
                </h1>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-white/80 backdrop-blur">
                  <MapPin size={16} strokeWidth={2.4} />
                  <span className="leading-none">{unitName}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onNotificationsClick}
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              aria-label="Abrir notificações"
            >
              <Bell size={20} />
              {notificationsBadge > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1 text-xs font-semibold text-white">
                  {notificationsBadge}
                </span>
              ) : null}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 text-white/90 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Faturamento do m\u00eas
              </p>
              <p className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                {totalRevenue}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-white/80">
                <Sparkles size={16} strokeWidth={2.2} />
                {totalRevenueLabel}
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Pontua\u00e7\u00e3o
              </p>
              <p className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                {points}
              </p>
              <span className="mt-3 inline-block text-xs font-medium text-white/75">
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
