import { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`input-field ${error ? 'border-[var(--color-danger)]' : ''}`}
        {...props}
      />
      {error && <span className="text-sm text-[var(--color-danger)] mt-1">{error}</span>}
    </div>
  );
};
