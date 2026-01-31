import React from "react";
import { theme } from "../theme";

interface LabeledInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  style?: React.CSSProperties;
}

export const LabeledInput: React.FC<LabeledInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  style = {},
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
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      style={{
        width: "100%",
        padding: theme.spacing.sm,
        border: `${theme.borders.width} solid ${theme.colors.border}`,
        borderRadius: theme.borders.radius.sm,
        fontSize: theme.typography.fontSize.base,
        background: theme.colors.bg,
        color: theme.colors.textDark,
        boxSizing: "border-box",
      }}
    />
  </div>
);
