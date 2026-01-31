import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../components/PageLayout";
// Removed FormField, use native inputs
import { theme } from "../theme";
import { LabeledInput } from "../components/LabeledInput";
import logbookBg from "../assets/img/SPACEDOS01.jpg";
import { DetectorTypeInfo } from "../components/DetectorTypeInfo";

export const DetectorCreatePage = ({
  apiBase,
  isAuthed,
  getAuthHeader,
}: {
  apiBase: string;
  isAuthed: boolean;
  getAuthHeader: () => { Authorization?: string };
}) => {
  const navigate = useNavigate();
  const [sn, setSn] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [owner, setOwner] = useState("");
  const [typeInfo, setTypeInfo] = useState<any | null>(null);
  const [accessOptions, setAccessOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Fetch detector type info when type changes
  useEffect(() => {
    if (!isAuthed) return; // waiting for creadentials

    if (!type) {
      setTypeInfo(null);
      return;
    }
    const fetchTypeInfo = async () => {
      try {
        const res = await fetch(`${apiBase}/detector-type/${type}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTypeInfo(data);
      } catch (e) {
        setTypeInfo(null);
      }
    };
    fetchTypeInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, apiBase, isAuthed]);

  useEffect(() => {
    if (!isAuthed) return; // waiting for creadentials

    // Fetch organizations where user is owner/admin
    const fetchOwnedOrgs = async () => {
      try {
        const res = await fetch(`${apiBase}/user/organizations/owned/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAccessOptions(
          Array.isArray(data)
            ? data.map((o: any) => ({ value: o.id, label: o.name }))
            : [],
        );
        setOwnerOptions(
          Array.isArray(data)
            ? data.map((o: any) => ({ value: o.id, label: o.name }))
            : [],
        );
      } catch (e) {
        setAccessOptions([]);
        setOwnerOptions([]);
      }
    };

    const fetchDetectorTypes = async () => {
      try {
        const res = await fetch(`${apiBase}/detector-type/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTypeOptions(
          Array.isArray(data)
            ? data.map((t: any) => ({ value: t.id, label: t.name }))
            : [],
        );
      } catch (e) {
        setTypeOptions([]);
        console.log(getAuthHeader());
      }
    };
    
    fetchOwnedOrgs();
    fetchDetectorTypes();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, isAuthed]);

  const [selectedAccess, setSelectedAccess] = useState<
    { value: string; label: string }[]
  >([]);
  const [accessDropdownOpen, setAccessDropdownOpen] = useState(false);
  const accessDropdownRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [typeOptions, setTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [ownerOptions, setOwnerOptions] = useState<
    { value: string; label: string }[]
  >([]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: any = {
        sn,
        name,
        type_id: type,
        owner,
        access: selectedAccess.map((o) => o.value),
      };
      const res = await fetch(`${apiBase}/detector/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${res.status}`);
      }
      navigate("/logbooks");
    } catch (e: any) {
      setError(`Failed to create detector: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthed) {
    return (
      <PageLayout
        backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}
      >
        <div className="panel">
          <div
            style={{
              color: theme.colors.danger,
              padding: theme.spacing["3xl"],
            }}
          >
            Login required to add detector.
          </div>
        </div>
      </PageLayout>
    );
  }


  return (
    <PageLayout
      backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}
    >
      <section className="panel">
        <header className="panel-header">
          <h2
            style={{
              marginTop: theme.spacing.md,
              marginBottom: theme.spacing.xs,
            }}
          >
            Add Detector
          </h2>
        </header>
        {error && (
          <div className="error" style={{ marginBottom: theme.spacing.lg }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="panel-body">
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
              <label
                htmlFor="type"
                style={{
                  display: "block",
                  marginBottom: theme.spacing.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.textDark,
                }}
              >
                Type *
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
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
              >
                <option value="">Select type...</option>
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Detector Type Info Display */}
            {type && typeInfo && (
              <DetectorTypeInfo type={typeInfo} />
            )}

            <div style={{ marginBottom: theme.spacing["2xl"] }}>
              <label
                htmlFor="owner"
                style={{
                  display: "block",
                  marginBottom: theme.spacing.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.textDark,
                }}
              >
                Owner *
              </label>
              <select
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                required
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
              >
                <option value="">Select owner...</option>
                {ownerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: theme.spacing["2xl"] }}>
              <label
                style={{
                  display: "block",
                  marginBottom: theme.spacing.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.textDark,
                }}
              >
                Give Access to Organizations
              </label>
              <div
                style={{ position: "relative", width: "100%" }}
                ref={accessDropdownRef}
              >
                <div
                  tabIndex={0}
                  style={{
                    width: "100%",
                    padding: theme.spacing.sm,
                    border: `${theme.borders.width} solid ${theme.colors.border}`,
                    borderRadius: theme.borders.radius.sm,
                    fontSize: theme.typography.fontSize.base,
                    background: theme.colors.bg,
                    color: theme.colors.textDark,
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                  onClick={() => setAccessDropdownOpen((v) => !v)}
                  onBlur={(e) => {
                    // Only close if focus leaves the dropdown
                    if (
                      !accessDropdownRef.current?.contains(
                        e.relatedTarget as Node,
                      )
                    ) {
                      setAccessDropdownOpen(false);
                    }
                  }}
                >
                  {accessOptions.length === 0
                    ? "No organizations available"
                    : "Select organizations..."}
                </div>
                {/* Access Dropdown */}
                {accessDropdownOpen && accessOptions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      width: "100%",
                      background: theme.colors.bg,
                      border: `${theme.borders.width} solid ${theme.colors.border}`,
                      borderRadius: theme.borders.radius.sm,
                      zIndex: 10,
                      maxHeight: 200,
                      overflowY: "auto",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    {accessOptions.map((opt) => (
                      <div
                        key={opt.value}
                        style={{
                          padding: theme.spacing.sm,
                          cursor: "pointer",
                          borderBottom: `1px solid ${theme.colors.mutedLighter}`,
                          background: "inherit",
                        }}
                        onMouseDown={(e) => {
                          // Use onMouseDown to ensure this fires before onBlur
                          e.preventDefault();
                          setSelectedAccess((sel) => [...sel, opt]);
                          setAccessOptions((opts) =>
                            opts.filter((o) => o.value !== opt.value),
                          );
                          setAccessDropdownOpen(false);
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Has Access Section */}
              {selectedAccess.length > 0 && (
                <div style={{ marginTop: theme.spacing.md }}>
                  <div
                    style={{
                      fontWeight: theme.typography.fontWeight.medium,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Organizations with Access:
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: theme.spacing.sm,
                    }}
                  >
                    {selectedAccess.map((opt) => (
                      <span
                        key={opt.value}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          background: theme.colors.mutedLighter,
                          color: theme.colors.textDark,
                          borderRadius: theme.borders.radius.sm,
                          padding: `0 ${theme.spacing.sm}`,
                          fontSize: theme.typography.fontSize.sm,
                          marginBottom: theme.spacing.xs,
                        }}
                      >
                        {opt.label}
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => {
                            setAccessOptions((opts) => [...opts, opt]);
                            setSelectedAccess((sel) =>
                              sel.filter((o) => o.value !== opt.value),
                            );
                          }}
                          style={{
                            paddingRight: 3,
                            marginRight: -6,
                            background: "none",
                            border: "none",
                            color: theme.colors.danger,
                            fontWeight: 900,
                            cursor: "pointer",
                            fontSize: "1.25em",
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form End */}

            <div style={{ display: "flex", gap: theme.spacing.lg }}>
              <button
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing["2xl"]}`,
                  background: submitting
                    ? theme.colors.muted
                    : theme.colors.success,
                  color: "white",
                  border: "none",
                  borderRadius: theme.borders.radius.sm,
                  fontSize: theme.typography.fontSize.base,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontWeight: theme.typography.fontWeight.medium,
                  transition: theme.transitions.fast,
                }}
              >
                {submitting ? "submitting..." : "Create Detector"}                
              </button>
              <button
                type="button"
                onClick={() => navigate("/logbooks")}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing["2xl"]}`,
                  background: theme.colors.bg,
                  color: theme.colors.textDark,
                  border: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
                  borderRadius: theme.borders.radius.sm,
                  fontSize: theme.typography.fontSize.base,
                  cursor: "pointer",
                  fontWeight: theme.typography.fontWeight.medium,
                  transition: theme.transitions.fast,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </section>
    </PageLayout>
  );
};
