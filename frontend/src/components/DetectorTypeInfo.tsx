import React from "react";
import { theme } from "../theme";

export interface DetectorTypeInfoProps {
  type: {
    name: string;
    description?: string;
    manufacturer?: { name?: string };
    image?: string;
  };
}

export const DetectorTypeInfo: React.FC<DetectorTypeInfoProps> = ({ type }) => {
  if (!type) return null;
  return (
    <div
      style={{
        marginBottom: theme.spacing["2xl"],
        padding: theme.spacing.lg,
        background: theme.colors.mutedLighter,
        borderRadius: theme.borders.radius.sm,
        display: "flex",
        gap: theme.spacing.xl,
        alignItems: "flex-start",
      }}
    >
      {type.image && (
        <img
          src={type.image}
          alt={type.name + " image"}
          style={{
            maxWidth: 120,
            maxHeight: 120,
            borderRadius: theme.borders.radius.sm,
            objectFit: "cover",
            marginRight: theme.spacing.lg,
          }}
        />
      )}
      <div>
        <div style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg }}>
          {type.name}
        </div>
        {type.manufacturer?.name && (
          <div style={{ color: theme.colors.muted, marginBottom: theme.spacing.xs }}>
            Manufacturer: {type.manufacturer.name}
          </div>
        )}
        {type.description && (
          <div style={{ marginTop: theme.spacing.sm }}>{type.description}</div>
        )}
      </div>
    </div>
  );
};
