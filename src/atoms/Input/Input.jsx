import React from 'react';

const Input = ({ label, error, helperText, className = '', ...props }) => {
  const inputClasses = `
    input-theme
    ${error ? 'border-feedback-light-error dark:border-feedback-dark-error focus:ring-feedback-light-error/50' : ''}
    ${className}
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && (
        <p className="text-feedback-light-error dark:text-feedback-dark-error text-sm">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
          {helperText}
        </p>
      )}
    </div>
  );
};

const Textarea = ({
  label,
  error,
  helperText,
  className = '',
  rows = 4,
  ...props
}) => {
  const textareaClasses = `
    input-theme
    resize-none
    ${error ? 'border-feedback-light-error dark:border-feedback-dark-error focus:ring-feedback-light-error/50' : ''}
    ${className}
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
          {label}
        </label>
      )}
      <textarea className={textareaClasses} rows={rows} {...props} />
      {error && (
        <p className="text-feedback-light-error dark:text-feedback-dark-error text-sm">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
          {helperText}
        </p>
      )}
    </div>
  );
};

const Select = ({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Selecione uma opção',
  className = '',
  ...props
}) => {
  const selectClasses = `
    input-theme
    ${error ? 'border-feedback-light-error dark:border-feedback-dark-error focus:ring-feedback-light-error/50' : ''}
    ${className}
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
          {label}
        </label>
      )}
      <select className={selectClasses} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-feedback-light-error dark:text-feedback-dark-error text-sm">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
          {helperText}
        </p>
      )}
    </div>
  );
};

export { Input, Textarea, Select };
