import { forwardRef } from 'react';
import './Input.css'; // Re-use input styles

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className={`input-wrapper ${className}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {props.required && <span className="input-required">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`input-field ${error ? 'has-error' : ''}`}
          style={{ height: 'auto', minHeight: '80px', padding: '12px' }}
          {...props}
        />
        {error && <span className="input-error-msg">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
