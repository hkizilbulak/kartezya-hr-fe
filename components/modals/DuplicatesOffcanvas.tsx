"use client";
import React, { useState, useCallback } from 'react';
import {
  Offcanvas,
  Button,
  Badge,
  Spinner,
  Modal,
  Alert,
  ListGroup,
} from 'react-bootstrap';
import {
  GitMerge,
  User,
  Award,
  Briefcase,
  CheckCircle,
  RefreshCw,
  Eye,
  BookOpen,
  FileText,
  Star,
} from 'react-feather';
import { cvSearchService } from '@/services/cv-search.service';
import type {
  DuplicateCandidateGroup,
  DuplicateCandidateItem,
} from '@/models/cv-search/cv-search.models';
import { toast } from 'react-toastify';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  show: boolean;
  onHide: () => void;
  groups: DuplicateCandidateGroup[];
  loading: boolean;
  onRefresh: () => void;
  onMerged: (mergedGroupKey: string) => void;
}

// ── Candidate Detail Modal ────────────────────────────────────────────────────

function CandidateDetailModal({
  item,
  isMaster,
  show,
  onHide,
  onSelectMaster,
}: {
  item: DuplicateCandidateItem;
  isMaster: boolean;
  show: boolean;
  onHide: () => void;
  onSelectMaster: () => void;
}) {
  if (!item) return null;

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="mb-3">
      <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#495057' }}>
        {icon}
        <span className="fw-semibold small">{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2" style={{ fontSize: 17 }}>
          <User size={18} />
          {item.name}
          {isMaster && <Badge bg="primary" style={{ fontSize: 11 }}>Master</Badge>}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Özet satır */}
        <div
          className="d-flex flex-wrap gap-3 mb-4 p-3 rounded"
          style={{ backgroundColor: '#f8f9fa', fontSize: 13 }}
        >
          <span className="d-flex align-items-center gap-1">
            <Briefcase size={13} className="text-muted" />
            {item.current_position || '—'}
          </span>
          <span className="d-flex align-items-center gap-1">
            <Award size={13} className="text-muted" />
            {item.seniority || '—'}
          </span>
          {item.experience_years > 0 && (
            <span className="text-muted">{item.experience_years} yıl deneyim</span>
          )}
          <span className="text-muted">ID: {item.candidate_id}</span>
          {item.created_at && (
            <span className="text-muted">
              {new Date(item.created_at).toLocaleDateString('tr-TR')}
            </span>
          )}
        </div>

        {/* Yetenekler */}
        {item.top_skills?.length > 0 && (
          <Section icon={<Star size={14} />} title="Yetenekler">
            <div className="d-flex flex-wrap gap-2">
              {item.top_skills.map((s) => (
                <span
                  key={s}
                  className="badge rounded-pill"
                  style={{ backgroundColor: '#e7f1ff', color: '#0d6efd', fontSize: 12, fontWeight: 500 }}
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Şirketler */}
        {item.companies?.length > 0 && (
          <Section icon={<Briefcase size={14} />} title="Çalıştığı Şirketler">
            <ListGroup variant="flush">
              {item.companies.map((c, i) => (
                <ListGroup.Item key={i} className="px-0 py-1 border-0" style={{ fontSize: 13 }}>
                  {c}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Section>
        )}

        {/* Eğitim */}
        {item.education?.length > 0 && (
          <Section icon={<BookOpen size={14} />} title="Eğitim">
            <ListGroup variant="flush">
              {item.education.map((e, i) => (
                <ListGroup.Item key={i} className="px-0 py-1 border-0" style={{ fontSize: 13 }}>
                  {e}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Section>
        )}

        {/* CV Dosyaları */}
        {item.cv_files?.length > 0 && (
          <Section icon={<FileText size={14} />} title="CV Dosyaları">
            <ListGroup variant="flush">
              {item.cv_files.map((f, i) => (
                <ListGroup.Item key={i} className="px-0 py-1 border-0" style={{ fontSize: 13, color: '#0d6efd' }}>
                  {f}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Section>
        )}

        {/* Boş uyarısı */}
        {!item.top_skills?.length && !item.companies?.length && !item.education?.length && !item.cv_files?.length && (
          <p className="text-muted small">Bu aday için ek detay bulunamadı.</p>
        )}
      </Modal.Body>

      <Modal.Footer className="justify-content-between">
        <Button variant="secondary" size="sm" onClick={onHide}>
          Kapat
        </Button>
        {!isMaster && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onSelectMaster();
              onHide();
            }}
          >
            <CheckCircle size={13} className="me-1" />
            Bu Adayı Master Yap
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

// ── Candidate mini card ────────────────────────────────────────────────────────

function CandidateMiniCard({
  item,
  isMaster,
  isSuggested,
  onSelectMaster,
}: {
  item: DuplicateCandidateItem;
  isMaster: boolean;
  isSuggested: boolean;
  onSelectMaster: () => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <div
        style={{
          border: isMaster ? '2px solid #0d6efd' : '1.5px solid #dee2e6',
          borderRadius: 10,
          padding: '12px 14px',
          backgroundColor: isMaster ? '#f0f6ff' : '#fff',
          transition: 'all 0.15s ease',
          width: '100%',
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-start gap-2 mb-2">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: isMaster ? '#0d6efd' : '#e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            {isMaster
              ? <CheckCircle size={14} color="#fff" />
              : <User size={14} color="#6c757d" />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fw-semibold text-truncate small" title={item.name}>
              {item.name || '—'}
            </div>
            <div className="text-muted" style={{ fontSize: 11 }}>ID: {item.candidate_id}</div>
          </div>
          <div className="d-flex flex-column align-items-end gap-1">
            {isSuggested && (
              <Badge bg="warning" text="dark" style={{ fontSize: 10 }}>Önerilen</Badge>
            )}
            {isMaster && (
              <Badge bg="primary" style={{ fontSize: 10 }}>Master</Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div style={{ fontSize: 12 }} className="text-muted mb-2">
          {item.current_position && (
            <div className="d-flex align-items-center gap-1 mb-1">
              <Briefcase size={11} />
              <span className="text-truncate">{item.current_position}</span>
            </div>
          )}
          {item.seniority && (
            <div className="d-flex align-items-center gap-1 mb-1">
              <Award size={11} />
              <span>{item.seniority}</span>
              {item.experience_years > 0 && (
                <span className="ms-1">· {item.experience_years} yıl</span>
              )}
            </div>
          )}
          {item.top_skills?.length > 0 && (
            <div className="d-flex flex-wrap gap-1 mt-1">
              {item.top_skills.slice(0, 3).map((s) => (
                <span
                  key={s}
                  style={{ backgroundColor: '#e9ecef', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}
                >
                  {s}
                </span>
              ))}
              {item.top_skills.length > 3 && (
                <span style={{ fontSize: 10, color: '#6c757d' }}>+{item.top_skills.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex gap-2 pt-1" style={{ borderTop: '1px solid #f0f0f0' }}>
          <Button
            variant="outline-secondary"
            size="sm"
            className="flex-fill"
            style={{ fontSize: 11, padding: '3px 6px' }}
            onClick={() => setDetailOpen(true)}
          >
            <Eye size={11} className="me-1" />
            Detay
          </Button>
          {!isMaster && (
            <Button
              variant="outline-primary"
              size="sm"
              className="flex-fill"
              style={{ fontSize: 11, padding: '3px 6px' }}
              onClick={onSelectMaster}
            >
              <CheckCircle size={11} className="me-1" />
              Master
            </Button>
          )}
        </div>
      </div>

      <CandidateDetailModal
        item={item}
        isMaster={isMaster}
        show={detailOpen}
        onHide={() => setDetailOpen(false)}
        onSelectMaster={onSelectMaster}
      />
    </>
  );
}

// ── Group card ────────────────────────────────────────────────────────────────

function DuplicateGroupCard({
  group,
  onMerged,
}: {
  group: DuplicateCandidateGroup;
  onMerged: () => void;
}) {
  const [masterID, setMasterID] = useState<number>(group.suggested_master_id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [merging, setMerging] = useState(false);

  const handleMerge = useCallback(async () => {
    const duplicateIDs = group.candidates
      .map((c) => c.candidate_id)
      .filter((id) => id !== masterID);

    if (duplicateIDs.length === 0) return;

    setMerging(true);
    try {
      await cvSearchService.mergeCandidates({
        master_candidate_id: masterID,
        duplicate_candidate_ids: duplicateIDs,
      });
      toast.success(`"${group.group_key}" grubu başarıyla birleştirildi.`);
      setConfirmOpen(false);
      onMerged();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Birleştirme sırasında hata oluştu.');
    } finally {
      setMerging(false);
    }
  }, [group, masterID, onMerged]);

  return (
    <>
      <div
        style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: 12,
          padding: '14px 14px 12px',
          marginBottom: 14,
        }}
      >
        {/* Group header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <span className="fw-semibold" style={{ textTransform: 'capitalize' }}>
              {group.group_key}
            </span>
            <Badge bg="secondary" className="ms-2" style={{ fontSize: 11 }}>
              {group.candidates.length} kayıt
            </Badge>
          </div>
        </div>

        {/* Candidate cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {group.candidates.map((c) => (
            <CandidateMiniCard
              key={c.candidate_id}
              item={c}
              isMaster={c.candidate_id === masterID}
              isSuggested={c.candidate_id === group.suggested_master_id}
              onSelectMaster={() => setMasterID(c.candidate_id)}
            />
          ))}
        </div>

        <div className="d-flex align-items-center justify-content-between">
          <span className="text-muted" style={{ fontSize: 12 }}>
            "Detay" ile inceleyip "Master" ile seçim yapabilirsiniz
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setConfirmOpen(true)}
          >
            <GitMerge size={13} className="me-1" />
            Birleştir
          </Button>
        </div>
      </div>

      {/* Confirm modal */}
      <Modal show={confirmOpen} onHide={() => !merging && setConfirmOpen(false)} size="sm" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16 }}>Birleştirmeyi Onayla</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-1">
            <strong>{group.candidates.length - 1}</strong> duplikasyon,{' '}
            <strong>
              {group.candidates.find((c) => c.candidate_id === masterID)?.name || `ID:${masterID}`}
            </strong>{' '}
            adayında birleştirilecek.
          </p>
          <Alert variant="warning" className="mb-0 mt-2 py-2" style={{ fontSize: 12 }}>
            Bu işlem geri alınamaz. Duplikasyon kayıtları silinecek.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmOpen(false)}
            disabled={merging}
          >
            Vazgeç
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleMerge}
            disabled={merging}
          >
            {merging ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Birleştiriliyor…
              </>
            ) : (
              'Onayla'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

// ── Main Offcanvas ────────────────────────────────────────────────────────────

export default function DuplicatesOffcanvas({
  show,
  onHide,
  groups,
  loading,
  onRefresh,
  onMerged,
}: Props) {
  const [localGroups, setLocalGroups] = useState<DuplicateCandidateGroup[]>(groups);

  React.useEffect(() => {
    setLocalGroups(groups);
  }, [groups]);

  const handleGroupMerged = useCallback((key: string) => {
    setLocalGroups((prev) => prev.filter((g) => g.group_key !== key));
    onMerged(key);
  }, [onMerged]);

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      style={{ width: 'min(680px, 100vw)' }}
    >
      <Offcanvas.Header closeButton className="border-bottom">
        <Offcanvas.Title className="d-flex align-items-center gap-2">
          <GitMerge size={18} />
          Duplikasyon Tespiti
          {localGroups.length > 0 && (
            <Badge bg="danger" style={{ fontSize: 12 }}>
              {localGroups.length}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body style={{ overflowY: 'auto' }}>
        {/* Toolbar */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="text-muted small">
            {loading
              ? 'Taranıyor…'
              : localGroups.length > 0
              ? `${localGroups.length} duplikasyon grubu bulundu`
              : 'Duplikasyon bulunamadı'
            }
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'me-1' : 'me-1'} />
            Yenile
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2 text-muted small">Adaylar taranıyor…</div>
          </div>
        )}

        {/* Empty */}
        {!loading && localGroups.length === 0 && (
          <div className="text-center py-5 text-muted">
            <CheckCircle size={36} className="mb-2 text-success" />
            <div className="fw-semibold">Duplikasyon bulunamadı</div>
            <div className="small mt-1">Tüm adaylar benzersiz görünüyor.</div>
          </div>
        )}

        {/* Groups */}
        {!loading && localGroups.map((g) => (
          <DuplicateGroupCard
            key={g.group_key}
            group={g}
            onMerged={() => handleGroupMerged(g.group_key)}
          />
        ))}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
