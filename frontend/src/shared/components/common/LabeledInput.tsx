import React from "react";
import { theme } from "@/theme";

type LabeledInputType = 'text' | 'email' | 'url' | 'password' | 'number' | 'select' | 'textarea' | 'datetime-local';

interface LabeledInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: LabeledInputType;
  disabled?: boolean;
  style?: React.CSSProperties;
  options?: { value: string; label: string }[];
  rows?: number;
  hint?: React.ReactNode;
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: theme.spacing.sm,
  border: `${theme.borders.width} solid ${theme.colors.border}`,
  borderRadius: theme.borders.radius.sm,
  fontSize: theme.typography.fontSize.base,
  background: theme.colors.bg,
  color: theme.colors.textDark,
  boxSizing: "border-box",
};

export const LabeledInput: React.FC<LabeledInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  disabled = false,
  style = {},
  options,
  rows = 4,
  hint,
}) => (
  <div style={{ marginBottom: theme.spacing["2xl"], ...style }}>
    <label
      htmlFor={id}
      style={{
        display: "block",
        marginBottom: theme.spacing.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.textDark,
      }}
    >
      {label} {required && "*"}
    </label>
    {type === "select" ? (
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={fieldStyle}
      >
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ) : type === "textarea" ? (
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        style={{ ...fieldStyle, fontFamily: "inherit", resize: "vertical" }}
      />
    ) : (
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={fieldStyle}
      />
    )}
    {hint && (
      <p style={{ marginTop: theme.spacing.xs, marginBottom: 0, fontSize: theme.typography.fontSize.xs, color: theme.colors.muted }}>
        {hint}
      </p>
    )}
  </div>
);
