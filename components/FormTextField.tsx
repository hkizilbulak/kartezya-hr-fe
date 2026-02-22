import React from "react";
import { Form, Col } from "react-bootstrap";

interface FormTextFieldProps {
  as?: any;
  md?: number;
  controlId: string;
  label: string;
  type?: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (name: string, value: string) => void;
  onBlur?: (name: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelStyle?: React.CSSProperties;
  rows?: number;
}

const FormTextField: React.FC<FormTextFieldProps> = ({
  as = Col,
  md = 12,
  controlId,
  label,
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  className,
  labelStyle,
  rows = 3,
  ...props
}) => {
  const Component = as;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(name, e.target.value);
  };

  const handleInputBlur = () => {
    if (onBlur) {
      onBlur(name);
    }
  };

  return (
    <Component md={md} className={className} {...props}>
      <Form.Group className="mb-3" controlId={controlId}>
        <Form.Label style={labelStyle}>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
        <Form.Control
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          isInvalid={!!error}
          as={type === "textarea" ? "textarea" : undefined}
          rows={type === "textarea" ? rows : undefined}
        />
        {error && (
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        )}
      </Form.Group>
    </Component>
  );
};

export default FormTextField;