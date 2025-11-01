import React from 'react';

const Input = ({ label, error, helperText, className = '', ...props }) => {
  const inputClasses = `
    input-theme
    ${error ? 'border-feedback-light-error dark:border-feedback-dark-error focus:ring-feedback-light-error/50' : ''}
    ${className}
  `;

  // Filtrar apenas atributos válidos para input
  const validInputProps = {};
  const validInputAttributes = [
    'type', 'id', 'name', 'value', 'placeholder', 'disabled',
    'readonly', 'required', 'minLength', 'maxLength', 'pattern',
    'min', 'max', 'step', 'onChange', 'onBlur', 'onFocus',
    'onClick', 'onKeyDown', 'onKeyUp', 'onPaste', 'autoComplete',
    'autoFocus', 'defaultValue', 'title', 'aria-label', 'aria-describedby'
  ];
  
  Object.keys(props).forEach(key => {
    if (validInputAttributes.includes(key)) {
      validInputProps[key] = props[key];
    }
  });

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
          {label}
        </label>
      )}
      <input className={inputClasses} {...validInputProps} />
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

  // Filtrar apenas atributos válidos para textarea
  const validTextareaProps = {};
  const validTextareaAttributes = [
    'id', 'name', 'value', 'placeholder', 'disabled',
    'readonly', 'required', 'minLength', 'maxLength',
    'onChange', 'onBlur', 'onFocus', 'onClick',
    'onKeyDown', 'onKeyUp', 'onPaste', 'autoComplete',
    'autoFocus', 'defaultValue', 'title', 'aria-label', 'aria-describedby'
  ];
  
  Object.keys(props).forEach(key => {
    if (validTextareaAttributes.includes(key)) {
      validTextareaProps[key] = props[key];
    }
  });

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
          {label}
        </label>
      )}
      <textarea className={textareaClasses} rows={rows} {...validTextareaProps} />
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

  // Filtrar apenas atributos válidos para select
  const validSelectProps = {};
  const validSelectAttributes = [
    'id', 'name', 'value', 'disabled', 'required',
    'onChange', 'onBlur', 'onFocus', 'onClick',
    'onKeyDown', 'onKeyUp', 'autoComplete', 'autoFocus',
    'defaultValue', 'title', 'aria-label', 'aria-describedby', 'multiple'
  ];
  
  Object.keys(props).forEach(key => {
    if (validSelectAttributes.includes(key)) {
      validSelectProps[key] = props[key];
    }
  });

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
          {label}
        </label>
      )}
      <select className={selectClasses} {...validSelectProps}>
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
