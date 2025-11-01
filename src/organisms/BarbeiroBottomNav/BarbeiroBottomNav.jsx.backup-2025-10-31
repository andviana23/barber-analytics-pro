import React from 'react';
import { CalendarDays, LineChart, Sparkles, Users2 } from 'lucide-react';

const defaultItems = [
  {
    key: 'overview',
    label: 'Resumo',
    icon: Sparkles,
    active: true,
  },
  {
    key: 'agenda',
    label: 'Agenda',
    icon: CalendarDays,
  },
  {
    key: 'clients',
    label: 'Clientes',
    icon: Users2,
  },
  {
    key: 'performance',
    label: 'Performance',
    icon: LineChart,
  },
];

const BarbeiroBottomNav = React.memo(({ items = defaultItems, onSelect }) => {
  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 mx-auto w-[calc(100%-2.5rem)] max-w-lg rounded-3xl border border-light-border/80 bg-light-surface/95 p-2 shadow-2xl backdrop-blur-md transition dark:border-dark-border/80 dark:bg-dark-surface/95 lg:hidden">
      <div className="flex items-stretch gap-2">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = Boolean(item.active);

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect?.(item.key)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-text-light-secondary hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary'
              }`}
            >
              {Icon ? (
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.6 : 2.2}
                  className={isActive ? 'text-white' : 'text-current'}
                />
              ) : null}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

BarbeiroBottomNav.displayName = 'BarbeiroBottomNav';

export default BarbeiroBottomNav;
