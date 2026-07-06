"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container, Row, Col, Card, Table, Button, Badge,
  Modal, Form, Spinner, InputGroup,
} from "react-bootstrap";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, X, Search } from "react-feather";
import CustomPagination from "@/components/Pagination";
import { toast } from "react-toastify";
import {
  mailConfigService,
  MailConfiguration,
  MailConfigPayload,
  MailRecipient,
  MailProvider,
  RecipientType,
  ValueType,
} from "@/services/mail-config.service";
import { emailService } from "@/services/email.service";
import { PageHeading } from "@/widgets";
import DeleteModal from "@/components/DeleteModal";
import LoadingOverlay from "@/components/LoadingOverlay";
import FormTextField from "@/components/FormTextField";
import FormSelectField from "@/components/FormSelectField";
import "@/styles/table-list.scss";
import "@/styles/components/table-common.scss";

// ── Dynamic placeholder options ────────────────────────────────
const DYNAMIC_PLACEHOLDERS = [
  { value: "{{TRIGGER_USER}}", label: "{{TRIGGER_USER}} — İşlemi yapan / hedef kullanıcının e-postası" },
];

const RECIPIENT_TYPES: RecipientType[] = ["TO", "CC", "BCC"];
const VALUE_TYPES: ValueType[] = ["STATIC", "DYNAMIC"];

const emptyRecipient = (): MailRecipient => ({
  recipient_type: "TO",
  value_type: "STATIC",
  recipient_value: "",
});

const emptyForm = (): MailConfigPayload => ({
  mail_key: "",
  description: "",
  provider: "RESEND",
  resend_template_code: "",
  is_active: true,
  recipients: [],
});

// ── Badge helpers ──────────────────────────────────────────────
const providerBadge = (p: MailProvider) =>
  p === "RESEND" ? (
    <Badge bg="primary" style={{ fontSize: "0.72rem" }}>RESEND</Badge>
  ) : (
    <Badge bg="secondary" style={{ fontSize: "0.72rem" }}>SMTP</Badge>
  );

const statusBadge = (active: boolean) =>
  active ? (
    <Badge bg="success" style={{ fontSize: "0.72rem" }}>Aktif</Badge>
  ) : (
    <Badge bg="danger" style={{ fontSize: "0.72rem" }}>Pasif</Badge>
  );

const recipientTypeBadge = (t: RecipientType) => {
  const map: Record<RecipientType, string> = { TO: "primary", CC: "info", BCC: "secondary" };
  return <Badge bg={map[t]} style={{ fontSize: "0.7rem", minWidth: 32 }}>{t}</Badge>;
};

/** Bir recipient_value içindeki virgül/noktalı virgül ayrılmış adresleri dizi olarak döner */
const splitAddresses = (value: string): string[] =>
  value.split(/[,;]/).map((s) => s.trim()).filter(Boolean);

/** Tüm recipient satırlarındaki gerçek adres sayısını hesaplar */
const countTotalAddresses = (recipients: MailRecipient[]): number =>
  recipients.reduce((sum, r) => sum + splitAddresses(r.recipient_value).length, 0);

// ── Main Component ─────────────────────────────────────────────
export default function MailConfigPage() {
  const [configs, setConfigs] = useState<MailConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Search / filter state
  const [searchKey, setSearchKey] = useState("");
  const [searchDesc, setSearchDesc] = useState("");
  const [filterProvider, setFilterProvider] = useState<"" | MailProvider>("");
  const [filterStatus, setFilterStatus] = useState<"" | "active" | "inactive">("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<MailConfigPayload>(emptyForm());

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Resend templates for dropdown
  const [resendTemplates, setResendTemplates] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mailConfigService.getAll();
      setConfigs(data);
    } catch {
      toast.error("Konfigürasyonlar yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchResendTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const data = await emailService.getTemplates();
      setResendTemplates(data);
    } catch {
      // non-fatal
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
    fetchResendTemplates();
  }, [fetchConfigs, fetchResendTemplates]);

  // ── Filtering & pagination ─────────────────────────────────
  const filteredConfigs = useMemo(() => {
    const keyLower = searchKey.toLowerCase();
    const descLower = searchDesc.toLowerCase();
    return configs.filter((c) => {
      if (keyLower && !c.mail_key.toLowerCase().includes(keyLower)) return false;
      if (descLower && !(c.description ?? "").toLowerCase().includes(descLower)) return false;
      if (filterProvider && c.provider !== filterProvider) return false;
      if (filterStatus === "active" && !c.is_active) return false;
      if (filterStatus === "inactive" && c.is_active) return false;
      return true;
    });
  }, [configs, searchKey, searchDesc, filterProvider, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredConfigs.length / pageSize));

  const paginatedConfigs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredConfigs.slice(start, start + pageSize);
  }, [filteredConfigs, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchKey, searchDesc, filterProvider, filterStatus, pageSize]);

  const clearFilters = () => {
    setSearchKey("");
    setSearchDesc("");
    setFilterProvider("");
    setFilterStatus("");
  };

  const hasActiveFilters = searchKey || searchDesc || filterProvider || filterStatus;

  // ── Modal helpers ──────────────────────────────────────────
  const openCreate = () => {
    setForm(emptyForm());
    setIsEdit(false);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (cfg: MailConfiguration) => {
    setForm({
      mail_key: cfg.mail_key,
      description: cfg.description,
      provider: cfg.provider,
      resend_template_code: cfg.resend_template_code,
      is_active: cfg.is_active,
      recipients: (cfg.recipients ?? []).map((r) => ({
        recipient_type: r.recipient_type,
        value_type: r.value_type,
        recipient_value: r.recipient_value,
      })),
    });
    setIsEdit(true);
    setEditId(cfg.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm());
  };

  // ── Recipients ─────────────────────────────────────────────
  const addRecipient = () =>
    setForm((f) => ({ ...f, recipients: [...f.recipients, emptyRecipient()] }));

  const removeRecipient = (i: number) =>
    setForm((f) => ({ ...f, recipients: f.recipients.filter((_, idx) => idx !== i) }));

  const updateRecipient = (i: number, field: keyof MailRecipient, val: string) =>
    setForm((f) => ({
      ...f,
      recipients: f.recipients.map((r, idx) =>
        idx === i ? { ...r, [field]: val } : r
      ),
    }));

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.mail_key.trim()) { toast.error("Mail anahtarı zorunludur"); return; }
    if (!form.provider) { toast.error("Sağlayıcı seçilmelidir"); return; }
    if (form.provider === "RESEND" && !form.resend_template_code.trim()) {
      toast.error("RESEND için şablon kodu zorunludur");
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit && editId) {
        await mailConfigService.update(editId, form);
        toast.success("Konfigürasyon güncellendi");
      } else {
        await mailConfigService.create(form);
        toast.success("Konfigürasyon oluşturuldu");
      }
      closeModal();
      fetchConfigs();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Kayıt başarısız");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await mailConfigService.delete(deleteId);
      toast.success("Silindi");
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchConfigs();
    } catch {
      toast.error("Silme başarısız");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      <Container fluid className="px-4">
        <PageHeading
          heading="Mail Konfigürasyonları"
          createButtonText="Yeni Konfigürasyon"
          showFilterButton={false}
          onCreate={openCreate}
        />

        <LoadingOverlay show={isLoading} />

        {/* ── Search / Filter Bar ────────────────────────────────── */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="py-3">
            <Row className="g-2 align-items-end">
              <Col xs={12} md={3}>
                <Form.Label className="small text-muted mb-1">Mail Anahtarı</Form.Label>
                <InputGroup size="sm">
                  <InputGroup.Text style={{ background: "#fff" }}>
                    <Search size={13} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Ara…"
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                  />
                  {searchKey && (
                    <Button variant="outline-secondary" size="sm" onClick={() => setSearchKey("")}>
                      <X size={12} />
                    </Button>
                  )}
                </InputGroup>
              </Col>

              <Col xs={12} md={3}>
                <Form.Label className="small text-muted mb-1">Açıklama</Form.Label>
                <InputGroup size="sm">
                  <InputGroup.Text style={{ background: "#fff" }}>
                    <Search size={13} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Ara…"
                    value={searchDesc}
                    onChange={(e) => setSearchDesc(e.target.value)}
                  />
                  {searchDesc && (
                    <Button variant="outline-secondary" size="sm" onClick={() => setSearchDesc("")}>
                      <X size={12} />
                    </Button>
                  )}
                </InputGroup>
              </Col>

              <Col xs={6} md={2}>
                <Form.Label className="small text-muted mb-1">Sağlayıcı</Form.Label>
                <Form.Select
                  size="sm"
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value as "" | MailProvider)}
                >
                  <option value="">Tümü</option>
                  <option value="RESEND">RESEND</option>
                  <option value="SMTP">SMTP</option>
                </Form.Select>
              </Col>

              <Col xs={6} md={2}>
                <Form.Label className="small text-muted mb-1">Durum</Form.Label>
                <Form.Select
                  size="sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "" | "active" | "inactive")}
                >
                  <option value="">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </Form.Select>
              </Col>

              <Col xs={12} md={2} className="d-flex align-items-end gap-2">
                {hasActiveFilters && (
                  <Button variant="outline-secondary" size="sm" onClick={clearFilters} className="d-flex align-items-center gap-1">
                    <X size={13} /> Temizle
                  </Button>
                )}
                <span className="text-muted small ms-auto">
                  {filteredConfigs.length} sonuç
                </span>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Table responsive className="table-list mb-0">
              <thead>
                <tr>
                  <th>Mail Anahtarı</th>
                  <th>Açıklama</th>
                  <th>Sağlayıcı</th>
                  <th>Şablon</th>
                  <th>Durum</th>
                  <th>Alıcılar</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedConfigs.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-5">
                      {hasActiveFilters ? "Arama kriterlerine uygun kayıt bulunamadı" : "Henüz konfigürasyon eklenmemiş"}
                    </td>
                  </tr>
                )}
                {paginatedConfigs.map((cfg) => (
                  <React.Fragment key={cfg.id}>
                    <tr>
                      <td>
                        <code style={{ fontSize: "0.8rem", background: "#f0f4ff", color: "#624bff", padding: "2px 6px", borderRadius: 4 }}>
                          {cfg.mail_key}
                        </code>
                      </td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cfg.description || <span className="text-muted">—</span>}
                      </td>
                      <td>{providerBadge(cfg.provider)}</td>
                      <td>
                        {cfg.resend_template_code
                          ? <span style={{ fontSize: "0.82rem" }}>{cfg.resend_template_code}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>{statusBadge(cfg.is_active)}</td>
                      <td>
                        {(cfg.recipients?.length ?? 0) > 0 ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-muted"
                            onClick={() => setExpandedId(expandedId === cfg.id ? null : cfg.id)}
                            style={{ fontSize: "0.8rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            {countTotalAddresses(cfg.recipients)} alıcı
                            {expandedId === cfg.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </Button>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "0.8rem" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          <Button variant="outline-primary" size="sm" onClick={() => openEdit(cfg)} title="Düzenle">
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            title="Sil"
                            onClick={() => { setDeleteId(cfg.id); setShowDeleteModal(true); }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded recipients row */}
                    {expandedId === cfg.id && (
                      <tr key={`${cfg.id}-recipients`} style={{ background: "#fafbff" }}>
                        <td colSpan={7} style={{ padding: "0.75rem 1.5rem" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {cfg.recipients.flatMap((r, i) =>
                              r.value_type === "DYNAMIC"
                                ? [(
                                  <span
                                    key={`${i}-dynamic`}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.35rem",
                                      background: "#fff",
                                      border: "1px solid #dee2e6",
                                      borderRadius: 20,
                                      padding: "3px 10px 3px 6px",
                                      fontSize: "0.78rem",
                                    }}
                                  >
                                    {recipientTypeBadge(r.recipient_type)}
                                    <span style={{ color: "#624bff" }}>{r.recipient_value}</span>
                                  </span>
                                )]
                                : splitAddresses(r.recipient_value).map((addr, j) => (
                                  <span
                                    key={`${i}-${j}`}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.35rem",
                                      background: "#fff",
                                      border: "1px solid #dee2e6",
                                      borderRadius: 20,
                                      padding: "3px 10px 3px 6px",
                                      fontSize: "0.78rem",
                                    }}
                                  >
                                    {recipientTypeBadge(r.recipient_type)}
                                    <span style={{ color: "#212529" }}>{addr}</span>
                                  </span>
                                ))
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* ── Pagination ─────────────────────────────────────────── */}
        {filteredConfigs.length > 0 && (
          <div className="mt-3">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredConfigs.length}
              itemsPerPage={pageSize}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        )}

        {/* ═══ CREATE / EDIT MODAL ════════════════════════════════ */}
        <Modal show={showModal} onHide={closeModal} size="lg" backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>
              {isEdit ? "Konfigürasyonu Düzenle" : "Yeni Konfigürasyon"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="mb-3">
              <Col md={6}>
                <FormTextField
                  controlId="mailKey"
                  label="Mail Anahtarı *"
                  name="mail_key"
                  value={form.mail_key}
                  onChange={(_, v) => setForm((f) => ({ ...f, mail_key: v.toUpperCase().replace(/\s/g, "_") }))}
                  placeholder="REPORT_EMAIL_CONTRACT"
                  disabled={isEdit}
                />
              </Col>
              <Col md={6}>
                <FormTextField
                  controlId="description"
                  label="Açıklama"
                  name="description"
                  value={form.description}
                  onChange={(_, v) => setForm((f) => ({ ...f, description: v }))}
                  placeholder="Sözleşme raporu mail bildirimi"
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <FormSelectField
                  name="provider"
                  label="Sağlayıcı *"
                  value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value as MailProvider, resend_template_code: "" }))}
                >
                  <option value="RESEND">RESEND</option>
                  <option value="SMTP">SMTP</option>
                </FormSelectField>
              </Col>
              <Col md={5}>
                {form.provider === "RESEND" && (
                  <FormSelectField
                    name="resend_template_code"
                    label="Resend Şablonu *"
                    value={form.resend_template_code}
                    onChange={(e) => setForm((f) => ({ ...f, resend_template_code: e.target.value }))}
                    disabled={isLoadingTemplates}
                  >
                    <option value="">{isLoadingTemplates ? "Yükleniyor…" : "Şablon seçin"}</option>
                    {resendTemplates.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </FormSelectField>
                )}
              </Col>
              <Col md={3} className="d-flex align-items-end pb-1">
                <Form.Check
                  type="switch"
                  id="isActive"
                  label="Aktif"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
              </Col>
            </Row>

            {/* Recipients */}
            <div style={{ borderTop: "1px solid #e9ecef", paddingTop: "1rem", marginTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#495057", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Alıcı Kuralları
                </span>
                <Button variant="outline-primary" size="sm" onClick={addRecipient} className="d-flex align-items-center gap-1">
                  <Plus size={13} /> Ekle
                </Button>
              </div>

              {form.recipients.length === 0 && (
                <p className="text-muted text-center" style={{ fontSize: "0.82rem", padding: "0.5rem 0" }}>
                  Henüz alıcı eklenmedi
                </p>
              )}

              {form.recipients.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 120px 1fr 32px",
                    gap: "0.5rem",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                    background: "#fafafa",
                    padding: "0.5rem",
                    borderRadius: 6,
                    border: "1px solid #e9ecef",
                  }}
                >
                  {/* Recipient Type */}
                  <Form.Select
                    size="sm"
                    value={r.recipient_type}
                    onChange={(e) => updateRecipient(i, "recipient_type", e.target.value)}
                  >
                    {RECIPIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Form.Select>

                  {/* Value Type */}
                  <Form.Select
                    size="sm"
                    value={r.value_type}
                    onChange={(e) => updateRecipient(i, "value_type", e.target.value as ValueType)}
                  >
                    {VALUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Form.Select>

                  {/* Value */}
                  {r.value_type === "DYNAMIC" ? (
                    <Form.Select
                      size="sm"
                      value={r.recipient_value}
                      onChange={(e) => updateRecipient(i, "recipient_value", e.target.value)}
                    >
                      <option value="">Placeholder seçin</option>
                      {DYNAMIC_PLACEHOLDERS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      size="sm"
                      type="email"
                      placeholder="ornek@kartezya.com"
                      value={r.recipient_value}
                      onChange={(e) => updateRecipient(i, "recipient_value", e.target.value)}
                    />
                  )}

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeRecipient(i)}
                    style={{ background: "none", border: "none", color: "#adb5bd", cursor: "pointer", padding: 4, borderRadius: 4, display: "flex", alignItems: "center" }}
                    title="Kaldır"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={closeModal}>İptal</Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving} className="d-flex align-items-center gap-2">
              {isSaving && <Spinner animation="border" size="sm" />}
              {isSaving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* ═══ DELETE MODAL ════════════════════════════════════════ */}
        {showDeleteModal && (
          <DeleteModal
            title="Konfigürasyonu Sil"
            message="Bu mail konfigürasyonunu silmek istediğinize emin misiniz? Tüm alıcı kuralları da silinecektir."
            onClose={() => { setShowDeleteModal(false); setDeleteId(null); }}
            onHandleDelete={handleDelete}
            loading={isDeleting}
          />
        )}
      </Container>
    </div>
  );
}
