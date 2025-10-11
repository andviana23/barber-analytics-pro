import React from 'react';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseClasses =
    'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg transition-colors duration-300';

  const variants = {
    default: '',
    elevated: 'shadow-sm hover:shadow-md',
    bordered: 'border-2',
    highlight: 'border-l-4 border-l-primary',
    success:
      'border-l-4 border-l-feedback-light-success dark:border-l-feedback-dark-success',
    error:
      'border-l-4 border-l-feedback-light-error dark:border-l-feedback-dark-error',
    warning:
      'border-l-4 border-l-feedback-light-warning dark:border-l-feedback-dark-warning',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const classes = `${baseClasses} ${variants[variant]} ${paddings[padding]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`border-b border-light-border dark:border-dark-border pb-4 mb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3
      className={`text-text-light-primary dark:text-text-dark-primary text-lg font-semibold ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`text-text-light-primary dark:text-text-dark-primary ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`border-t border-light-border dark:border-dark-border pt-4 mt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
