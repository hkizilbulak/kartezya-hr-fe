"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Container, Form, Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { Plus, X, Send, Lock, RefreshCw } from "react-feather";
import axiosInstance from "@/helpers/api/axiosInstance";
import { emailService } from "@/services/email.service";
import { mailConfigService, MailConfiguration } from "@/services/mail-config.service";
import { PageHeading } from "@/widgets";
import FormSelectField from "@/components/FormSelectField";
import styles from "./page.module.scss";

// ── Types ──────────────────────────────────────────────────────
interface EmployeeResult {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_email?: string;
  work_information?: {
    department_name?: string;
    manager?: string;
    job_title?: string;
  } | null;
}

interface DynamicField {
  id: number;
  key: string;
  value: string;
}

// ── Helpers ────────────────────────────────────────────────────
const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I",
  ö: "o", Ö: "O", ş: "s", Ş: "S", ü: "u", Ü: "U",
};

function toSnakeCase(raw: string): string {
  return raw
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

// ── Component ──────────────────────────────────────────────────
let fieldSeq = 0;
const nextId = () => ++fieldSeq;

export default function SendMailPage() {
  // ── Template state ──
  const [templates, setTemplates] = useState<MailConfiguration[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateCode, setTemplateCode] = useState("");
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [selectedMailKey, setSelectedMailKey] = useState("");
  const [subject, setSubject] = useState("");

  // ── Employee search state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EmployeeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // ── Middle panel state ──
  const [customerTeam, setCustomerTeam] = useState("");
  const [customerManager, setCustomerManagerState] = useState("");
  
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);

  // ── Send state ──
  const [isSending, setIsSending] = useState(false);

  // ── Validation errors ──
  const [errors, setErrors] = useState<Record<string, string>>({});

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // ── Fetch mail configs on mount ──
  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const data = await mailConfigService.getAll();
      setTemplates(data.filter((c) => c.is_active));
    } catch {
      toast.error("Mail konfigürasyonları alınamadı");
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // Fetch template variables when templateCode changes
  useEffect(() => {
    let mounted = true;
    const fetchVars = async () => {
      if (!templateCode) {
        setTemplateVariables([]);
        return;
      }
      try {
        const vars = await emailService.getTemplateVariables(templateCode);
        if (mounted) setTemplateVariables(vars);
      } catch (err) {
        if (mounted) setTemplateVariables([]);
      }
    };
    fetchVars();
    return () => { mounted = false; };
  }, [templateCode]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Debounced search ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axiosInstance.get("/employees", {
          params: { first_name: searchQuery.trim(), status: "ACTIVE", limit: 10, page: 1, direction: "ASC" },
        });
        const items: EmployeeResult[] =
          res.data?.data ?? res.data?.items ?? res.data ?? [];
        setSearchResults(items);
        setShowDropdown(items.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [searchQuery]);

  // ── Populate middle panel when employee is selected ──
  const selectEmployee = useCallback((emp: EmployeeResult) => {
    setSelectedEmployees((prev) => {
      if (prev.find((e) => e.id === emp.id)) return prev; // zaten listede
      // İlk eklenen çalışandan departman/yönetici otomatik doldur
      if (prev.length === 0) {
        setCustomerTeam(emp.work_information?.department_name ?? "");
        setCustomerManagerState(emp.work_information?.manager ?? "");
      }
      return [...prev, emp];
    });
    setSearchQuery("");
    setShowDropdown(false);
    setSearchResults([]);
    setErrors((p) => ({ ...p, employee: "" }));
  }, []);

  const removeEmployee = (id: number) => {
    setSelectedEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const clearAll = () => {
    setSelectedEmployees([]);
    setSearchQuery("");
    setCustomerTeam("");
    setCustomerManagerState("");
    setDynamicFields([]);
    setErrors({});
  };

  // ── Dynamic fields ──
  const addDynamicField = () =>
    setDynamicFields((prev) => [...prev, { id: nextId(), key: "", value: "" }]);

  const updateDynamicField = (
    id: number,
    field: "key" | "value",
    raw: string
  ) => {
    setDynamicFields((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, [field]: field === "key" ? toSnakeCase(raw) : raw }
          : f
      )
    );
  };

  const removeDynamicField = (id: number) =>
    setDynamicFields((prev) => prev.filter((f) => f.id !== id));

  // ── Live preview payload (ilk seçili çalışan üzerinden) ──
  const buildTemplateData = useCallback((): Record<string, string> => {
    const data: Record<string, string> = {};
    const emp = selectedEmployees[0];
    if (emp) {
      data["fullname"] = `${emp.first_name} ${emp.last_name}`.trim();
      // Use company_email for template variables / preview. Fall back to personal email if company_email is missing.
      data["email"] = emp.company_email ?? emp.email;
      // Add firstname so templates can use it directly
      data["firstname"] = emp.first_name ?? "";
    }
    data["customer_team"] = customerTeam;
  data["customer_manager"] = customerManager;
    dynamicFields.forEach((f) => {
      if (f.key) data[f.key] = f.value;
    });
    return data;
  }, [selectedEmployees, customerTeam, customerManager, dynamicFields]);

  const templateData = buildTemplateData();

  // ── Validate ──
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!templateCode.trim()) errs.templateCode = "Şablon kodu zorunludur";
    if (selectedEmployees.length === 0) errs.employee = "En az bir çalışan seçmelisiniz";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Send ──
  const handleSend = async () => {
    if (!validate()) return;
    setIsSending(true);
    let successCount = 0;
    const failedEmails: string[] = [];
    // Determine selected mail configuration
    const selectedConfig = templates.find((t) => t.mail_key === selectedMailKey);

    // Helper to extract TO recipient config
    const toRecipient = selectedConfig?.recipients?.find((r) => r.recipient_type === 'TO');
    const toIsDynamic = toRecipient ? toRecipient.value_type === 'DYNAMIC' : true;

    if (!toIsDynamic) {
      // Static TO: send based on static recipient values from config (use first selected employee for template data)
      const staticRecipientsRaw = (toRecipient?.recipient_value ?? "").split(",").map(s => s.trim()).filter(Boolean);
      const emp = selectedEmployees[0];
      const baseData: Record<string, string> = {
        ...templateData,
      };
      if (emp) {
        baseData.fullname = `${emp.first_name} ${emp.last_name}`.trim();
        baseData.email = emp.email;
      }

      for (const recipient of staticRecipientsRaw) {
        try {
          await emailService.sendDynamicTemplate({
            to: recipient,
            template_code: templateCode.trim(),
            mail_key: selectedMailKey || undefined,
            subject: subject.trim() || undefined,
            template_data: baseData,
          });
          successCount++;
        } catch {
          failedEmails.push(recipient);
        }
      }
    } else {
      // Dynamic TO (default): send per selected employee
      for (const emp of selectedEmployees) {
        try {
          const empData: Record<string, string> = {
            ...templateData,
            fullname: `${emp.first_name} ${emp.last_name}`.trim(),
            email: emp.email,
          };
          await emailService.sendDynamicTemplate({
            to: emp.email,
            template_code: templateCode.trim(),
            mail_key: selectedMailKey || undefined,
            subject: subject.trim() || undefined,
            template_data: empData,
          });
          successCount++;
        } catch {
          failedEmails.push(`${emp.first_name} ${emp.last_name}`);
        }
      }
    }

      setIsSending(false);

    if (successCount > 0) {
      toast.success(`${successCount} kişiye mail başarıyla gönderildi`);
      setTemplateCode("");
      setSelectedMailKey("");
      setSubject("");
      setSelectedEmployees([]);
  setSearchQuery("");
  setCustomerTeam("");
  setCustomerManagerState("");
  setDynamicFields([]);
      setErrors({});
    }
    if (failedEmails.length > 0) {
      toast.error(`${failedEmails.length} kişiye gönderilemedi: ${failedEmails.join(", ")}`);
    }
  };

  // ── Render ──
  return (
    <div className={styles.page}>
      <Container fluid className="px-4">
        <PageHeading
          heading="Dinamik Mail Gönder"
          showCreateButton={false}
          showFilterButton={false}
        />

        <div className={styles.panelGrid}>
          {/* ═══ LEFT: Şablon + Çalışan Seçimi ════════════════ */}
          <div className={styles.panel}>
            <p className={styles.panelTitle}>Şablon & Alıcı</p>

            {/* Mail Konfigürasyonu */}
            <Form.Group className="mb-3">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <Form.Label className={styles.fieldLabel} style={{ margin: 0 }}>
                  Mail Konfigürasyonu
                  <span className={styles.requiredMark}>*</span>
                </Form.Label>
                <Button
                  variant="link"
                  size="sm"
                  onClick={fetchTemplates}
                  disabled={isLoadingTemplates}
                  title="Listeyi yenile"
                  style={{ padding: 0, color: "#6c757d", lineHeight: 1 }}
                >
                  {isLoadingTemplates
                    ? <Spinner animation="border" size="sm" style={{ width: "0.85rem", height: "0.85rem", borderWidth: "2px" }} />
                    : <RefreshCw size={13} />}
                </Button>
              </div>
              <FormSelectField
                name="templateCode"
                value={templateCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setTemplateCode(code);
                  const found = templates.find((t) => t.resend_template_code === code);
                  setSelectedMailKey(found?.mail_key ?? "");
                  if (errors.templateCode)
                    setErrors((p) => ({ ...p, templateCode: "" }));
                }}
                disabled={isLoadingTemplates}
                isInvalid={!!errors.templateCode}
                errorMessage={errors.templateCode}
              >
                <option value="">
                  {isLoadingTemplates ? "Yükleniyor…" : "Konfigürasyon seçin"}
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.resend_template_code}>
                    {t.description || t.mail_key}
                  </option>
                ))}
              </FormSelectField>
            </Form.Group>

            {/* Subject (optional) */}
            <Form.Group className="mb-3">
              <Form.Label className={styles.fieldLabel}>
                Mail Konusu <span style={{ color: "#adb5bd", fontWeight: 400 }}>(isteğe bağlı)</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Boş bırakılırsa 'Bilgilendirme' kullanılır"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Form.Group>

            {/* Employee Search */}
            <Form.Group className="mb-1">
              <Form.Label className={styles.fieldLabel}>
                Çalışan Ara
                <span className={styles.requiredMark}>*</span>
              </Form.Label>
              <div className={styles.searchWrapper} ref={searchWrapperRef}>
                <div style={{ position: "relative" }}>
                  <Form.Control
                    type="text"
                    placeholder="İsim yazın… (sadece aktif çalışanlar)"
                    value={searchQuery}
                    autoComplete="off"
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (errors.employee)
                        setErrors((p) => ({ ...p, employee: "" }));
                    }}
                    isInvalid={!!errors.employee}
                    style={{ paddingRight: isSearching ? "2.5rem" : undefined }}
                  />
                  {isSearching && (
                    <div style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                    }}>
                      <Spinner animation="border" size="sm" style={{ color: "#624bff", width: "1rem", height: "1rem", borderWidth: "2px" }} />
                    </div>
                  )}
                </div>
                {errors.employee && (
                  <Form.Control.Feedback type="invalid" style={{ display: "block" }}>
                    {errors.employee}
                  </Form.Control.Feedback>
                )}

                {/* Dropdown */}
                {(showDropdown || isSearching) && searchQuery.trim() && (
                  <div className={styles.searchDropdown}>
                    {isSearching ? (
                      <div style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6c757d", fontSize: "0.85rem" }}>
                        <Spinner animation="border" size="sm" style={{ marginRight: "0.5rem" }} />
                        Aranıyor…
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#adb5bd", fontSize: "0.85rem" }}>
                        Sonuç bulunamadı
                      </div>
                    ) : (
                      searchResults.map((emp) => {
                        const alreadyAdded = selectedEmployees.some((e) => e.id === emp.id);
                        return (
                          <div
                            key={emp.id}
                            className={styles.searchItem}
                            onMouseDown={() => !alreadyAdded && selectEmployee(emp)}
                            style={{ opacity: alreadyAdded ? 0.45 : 1, cursor: alreadyAdded ? "not-allowed" : "pointer" }}
                          >
                            <div className={styles.searchItemName}>
                              {emp.first_name} {emp.last_name}
                              {alreadyAdded && <span style={{ fontSize: "0.72rem", color: "#624bff", marginLeft: 6 }}>✓ Eklendi</span>}
                            </div>
                            <div className={styles.searchItemSub}>
                              {emp.email}
                              {emp.work_information?.department_name
                                ? ` · ${emp.work_information.department_name}`
                                : ""}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </Form.Group>

            {/* Seçilen çalışanlar — chip listesi */}
            {selectedEmployees.length > 0 && (
              <div className={styles.employeeChipList}>
                {selectedEmployees.map((emp) => (
                  <div key={emp.id} className={styles.employeeChip}>
                    <span className={styles.chipAvatar}>
                      {getInitials(emp.first_name, emp.last_name)}
                    </span>
                    <div className={styles.chipInfo}>
                      <span className={styles.chipName}>{emp.first_name} {emp.last_name}</span>
                      <span className={styles.chipEmail}>{emp.email}</span>
                    </div>
                    <button
                      className={styles.chipRemove}
                      onClick={() => removeEmployee(emp.id)}
                      title="Listeden çıkar"
                      type="button"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ MIDDLE: Değişken Yönetimi ═══════════════════════ */}
          <div className={styles.panel}>
            <p className={styles.panelTitle}>Şablon Değişkenleri</p>

            {/* Locked: fullname */}
            <Form.Group className="mb-3">
              <Form.Label className={styles.fieldLabel}>
                fullname
                <span className={styles.readonlyBadge}><Lock size={9} /> Otomatik</span>
              </Form.Label>
              <Form.Control
                className={styles.readonlyInput}
                readOnly
                value={
                  selectedEmployees.length === 1
                    ? `${selectedEmployees[0].first_name} ${selectedEmployees[0].last_name}`
                    : selectedEmployees.length > 1
                    ? `(${selectedEmployees.length} kişi seçildi)`
                    : ""
                }
                placeholder="Çalışan seçilince dolar"
              />
            </Form.Group>

            {/* Locked: email */}
            <Form.Group className="mb-3">
              <Form.Label className={styles.fieldLabel}>
                email
                <span className={styles.readonlyBadge}><Lock size={9} /> Otomatik</span>
              </Form.Label>
              <Form.Control
                className={styles.readonlyInput}
                readOnly
                value={
                  selectedEmployees.length === 1
                    ? (selectedEmployees[0].company_email ?? selectedEmployees[0].email)
                    : selectedEmployees.length > 1
                    ? "(Her kişiye kendi e-postası gönderilir)"
                    : ""
                }
                placeholder="Çalışan seçilince dolar"
              />
            </Form.Group>

            {/* Editable: customer_team */}
            <Form.Group className="mb-3">
              <Form.Label className={styles.fieldLabel}>customer_team</Form.Label>
              <Form.Control
                type="text"
                placeholder="Departman / takım adı"
                value={customerTeam}
                onChange={(e) => setCustomerTeam(e.target.value)}
                disabled={selectedEmployees.length === 0}
              />
            </Form.Group>

            {/* Editable: customer_manager */}
            <Form.Group className="mb-3">
              <Form.Label className={styles.fieldLabel}>customer_manager</Form.Label>
              <Form.Control
                type="text"
                placeholder="Müşteri yöneticisi"
                value={customerManager}
                onChange={(e) => setCustomerManagerState(e.target.value)}
                disabled={selectedEmployees.length === 0}
              />
            </Form.Group>

            

            {/* Dynamic fields */}
            {dynamicFields.length > 0 && (
              <div className="mb-2">
                <div
                  className={styles.dynamicRow}
                  style={{ marginBottom: "0.25rem" }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#6c757d",
                    }}
                  >
                    Anahtar (snake_case)
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#6c757d",
                    }}
                  >
                    Değer
                  </span>
                  <span />
                </div>
                {dynamicFields.map((f) => (
                  <div key={f.id} className={styles.dynamicRow}>
                    <Form.Control
                      size="sm"
                      placeholder="degisken_adi"
                      value={f.key}
                      onChange={(e) =>
                        updateDynamicField(f.id, "key", e.target.value)
                      }
                      disabled={selectedEmployees.length === 0}
                    />
                    <Form.Control
                      size="sm"
                      placeholder="değer"
                      value={f.value}
                      onChange={(e) =>
                        updateDynamicField(f.id, "value", e.target.value)
                      }
                      disabled={selectedEmployees.length === 0}
                    />
                    <button
                      className={styles.removeRowBtn}
                      onClick={() => removeDynamicField(f.id)}
                      title="Sil"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              className={styles.addRowBtn}
              onClick={addDynamicField}
              disabled={selectedEmployees.length === 0}
            >
              <Plus size={14} />
              Yeni Alan Ekle
            </button>
          </div>

          {/* ═══ RIGHT: Önizleme + Gönder ════════════════════════ */}
          <div className={styles.panel}>
            <p className={styles.panelTitle}>Canlı Önizleme</p>

            <div className={styles.previewBox}>
              {Object.keys(templateData).length === 0 ? (
                <div className={styles.previewEmpty}>
                  Çalışan seçilince payload burada görünür
                </div>
              ) : (
                <>
                  <span style={{ color: "#6c757d" }}>{"{\n"}</span>
                  {(() => {
                    const entries = Object.entries(templateData);
                    const fullnameEntryIndex = entries.findIndex(([k]) => k === "fullname");
                    let ordered: [string, any][] = [];
                    if (fullnameEntryIndex !== -1) {
                      ordered.push(entries[fullnameEntryIndex]);
                      ordered = ordered.concat(entries.filter((_, i) => i !== fullnameEntryIndex));
                    } else {
                      // ensure fullname is present as first entry with placeholder if missing
                      const firstEntry: [string, any] = ["fullname", templateData["fullname"] ?? ""];
                      ordered = [firstEntry].concat(entries);
                    }
                    return ordered.map(([k, v]) => (
                      <span key={k}>
                        {"  "}
                        <span className={styles.previewKey}>"{k}"</span>
                        {`: "${v}",\n`}
                      </span>
                    ));
                  })()}
                  <span style={{ color: "#6c757d" }}>{"}"}</span>
                </>
              )}
            </div>

            {templateCode && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  background: "#f0f4ff",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  color: "#624bff",
                }}
              >
                <strong>template_code:</strong> {templateCode}
                {subject && (
                  <>
                    <br />
                    <strong>subject:</strong> {subject}
                  </>
                )}
              </div>
            )}

            {/* Template variables card */}
            {templateVariables && templateVariables.length > 0 && (
              <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#fff8e6", borderRadius: 6 }}>
                <strong>Şablon Parametreleri</strong>
                <div style={{ marginTop: 8, fontSize: "0.9rem" }}>
                  <div style={{ color: "#6c757d", marginBottom: 6 }}>Bu şablon için Resend'den bulunan değişkenler ve örnek değerler:</div>
                    {templateVariables
                    .map((v) => ({ raw: v?.toString() ?? "", name: (v?.toString() ?? "").replace(/[^a-zA-Z0-9_]/g, "") }))
                    .filter(({ name }) => name)
                    .map(({ raw, name }) => (
                      <div key={raw + name} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6 }}>
                        <div style={{ fontFamily: "monospace", background: "#f1f3f5", padding: "4px 8px", borderRadius: 4 }}>{name}</div>
                        <div style={{ color: "#495057" }}>{templateData[name] ?? templateData[raw] ?? `<örnek: ${name}>`}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <Button
              variant="primary"
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Spinner animation="border" size="sm" />
                  Gönderiliyor…
                </>
              ) : (
                <>
                  <Send size={15} />
                  {selectedEmployees.length > 1
                    ? `${selectedEmployees.length} Kişiye Gönder`
                    : "Gönder"}
                </>
              )}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
