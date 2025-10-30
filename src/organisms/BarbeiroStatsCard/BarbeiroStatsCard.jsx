import React from 'react';
import { TrendingUp } from 'lucide-react';

const cardToneMap = {
  primary:
    'border-primary/20 bg-primary/5 dark:border-primary/20 dark:bg-primary/10',
  success:
    'border-success/20 bg-success/5 dark:border-success/20 dark:bg-success/10',
  warning:
    'border-warning/20 bg-warning/5 dark:border-warning/20 dark:bg-warning/10',
  info: 'border-info/20 bg-info/5 dark:border-info/20 dark:bg-info/10',
  neutral:
    'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface',
};

const badgeToneMap = {
  primary: 'bg-primary/15 text-primary dark:bg-primary/20',
  success: 'bg-success/15 text-success dark:bg-success/20',
  warning: 'bg-warning/15 text-warning dark:bg-warning/20',
  info: 'bg-info/15 text-info dark:bg-info/20',
  neutral:
    'bg-light-hover text-text-light-secondary dark:bg-dark-hover dark:text-text-dark-secondary',
};

const annotationToneMap = {
  positive: 'text-success',
  warning: 'text-warning',
  neutral: 'text-text-light-secondary dark:text-text-dark-secondary',
};

const BarbeiroStatsCard = React.memo(
  ({
    title,
    value,
    helper,
    icon: Icon = TrendingUp,
    tone = 'neutral',
    annotation,
    annotationTone = 'neutral',
  }) => {
    const cardTone = cardToneMap[tone] ?? cardToneMap.neutral;
    const badgeTone = badgeToneMap[tone] ?? badgeToneMap.neutral;
    const annotationClass =
      annotationToneMap[annotationTone] ?? annotationToneMap.neutral;

    return (
      <div
        className={`flex flex-col gap-4 rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${cardTone}`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
            {title}
          </p>
          <span
            className={`inline-flex items-center justify-center rounded-2xl border border-transparent px-3 py-1 text-sm font-semibold ${badgeTone}`}
          >
            <Icon size={18} strokeWidth={2.4} />
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-3xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            {value}
          </span>
          {helper ? (
            <p className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
              {helper}
            </p>
          ) : null}
          {annotation ? (
            <p className={`text-xs font-semibold ${annotationClass}`}>
              {annotation}
            </p>
          ) : null}
        </div>
      </div>
    );
  }
);

BarbeiroStatsCard.displayName = 'BarbeiroStatsCard';

export default BarbeiroStatsCard;
