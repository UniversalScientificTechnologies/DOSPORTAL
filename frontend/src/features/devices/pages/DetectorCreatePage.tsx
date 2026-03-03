import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AppSelect } from '@/shared/components/common/AppSelect';
import type { SelectOption } from '@/shared/components/common/AppSelect';
import { PageLayout } from "@/shared/components/Layout/PageLayout";
import { theme } from "@/theme";
import { LabeledInput } from "@/shared/components/common/LabeledInput";
import logbookBg from "@/assets/img/SPACEDOS01.jpg";
import { DetectorTypeInfo } from "@/features/devices/components/DetectorTypeInfo";
import { Button } from "@/shared/components/Button/Button";
import { Section } from "@/shared/components/Layout/Section";
import {
  useDetectorTypesList,
  useDetectorTypesRetrieve,
  useDetectorsCreate,
} from "@/api/detectors/detectors";
import { useUserOrganizationsOwnedList } from "@/api/authentication/authentication";
import type { DetectorRequest } from "@/api/model";

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: theme.spacing.sm,
  fontWeight: theme.typography.fontWeight.medium,
  color: theme.colors.textDark,
};

export const DetectorCreatePage = () => {
  const navigate = useNavigate();
  const [sn, setSn] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<SelectOption | null>(null);
  const [owner, setOwner] = useState<SelectOption | null>(null);
  const [selectedAccess, setSelectedAccess] = useState<SelectOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const detectorTypesQuery = useDetectorTypesList();
  const typeOptions: SelectOption[] = (detectorTypesQuery.data?.data?.results ?? []).map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const typeInfoQuery = useDetectorTypesRetrieve(type?.value ?? "", { query: { enabled: !!type } });
  const typeInfo = typeInfoQuery.data?.data ?? null;

  const ownedOrgsQuery = useUserOrganizationsOwnedList();
  const ownedOrgs = (ownedOrgsQuery.data?.data ?? []) as { id: string; name: string }[];
  const ownerOptions: SelectOption[] = ownedOrgs.map((o) => ({ value: o.id, label: o.name }));

  const createMutation = useDetectorsCreate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createMutation.mutateAsync({
        data: {
          sn,
          name,
          type_id: type!.value,
          owner_id: owner!.value,
          access: selectedAccess.map((o) => o.value),
          ...(imageFile ? { image: imageFile } : {}),
        } as DetectorRequest,
      });
      navigate("/logbooks");
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as Record<string, string> | undefined)?.detail ?? err.message
        : err instanceof Error ? err.message : "Failed to create detector";
      setError(detail);
    }
  };

  return (
    <PageLayout
      backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}
    >
      <Section title="Add Detector" error={error}>
        <form onSubmit={handleSubmit}>
          <div style={{ maxWidth: 600 }}>
            <LabeledInput
              id="sn"
              label="Serial Number (SN)"
              value={sn}
              onChange={(e) => setSn(e.target.value)}
              placeholder="e.g., 123456"
              required
            />

            <LabeledInput
              id="name"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Detector name"
              required
            />

            <div style={{ marginBottom: theme.spacing["2xl"] }}>
              <label htmlFor="type" style={labelStyle}>Type *</label>
              <AppSelect
                inputId="type"
                options={typeOptions}
                value={type}
                onChange={(opt) => setType(opt)}
                placeholder="Select type..."
                isLoading={detectorTypesQuery.isLoading}
              />
            </div>

            {type && typeInfo && (
              <DetectorTypeInfo type={typeInfo as unknown as { name: string; description?: string; manufacturer?: { name?: string }; image?: string }} />
            )}

            <div style={{ marginBottom: theme.spacing["2xl"] }}>
              <label htmlFor="owner" style={labelStyle}>Owner *</label>
              <AppSelect
                inputId="owner"
                options={ownerOptions}
                value={owner}
                onChange={(opt) => setOwner(opt)}
                placeholder="Select owner..."
                isLoading={ownedOrgsQuery.isLoading}
              />
            </div>

            <div style={{ marginBottom: theme.spacing["2xl"] }}>
              <label style={labelStyle}>Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'block', marginBottom: theme.spacing.sm }}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '240px',
                    maxHeight: '180px',
                    objectFit: 'contain',
                    borderRadius: theme.borders.radius.sm,
                    border: `${theme.borders.width} solid ${theme.colors.border}`,
                    marginTop: theme.spacing.xs,
                  }}
                />
              )}
            </div>

            <div style={{ marginBottom: theme.spacing["2xl"] }}>
              <label htmlFor="access" style={labelStyle}>Give Access to Organizations</label>
              <AppSelect<true>
                inputId="access"
                isMulti
                options={ownerOptions}
                value={selectedAccess}
                onChange={(opts) => setSelectedAccess(opts as SelectOption[])}
                placeholder="Select organizations..."
                isLoading={ownedOrgsQuery.isLoading}
              />
            </div>

            <div style={{ display: "flex", gap: theme.spacing.lg }}>
              <Button variant="primary" size="md" type="submit" disabled={createMutation.isPending || !type || !owner}>
                {createMutation.isPending ? "Submitting..." : "Create Detector"}
              </Button>
              <Button variant="secondary" size="md" type="button" onClick={() => navigate("/devices")}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </Section>
    </PageLayout>
  );
};
