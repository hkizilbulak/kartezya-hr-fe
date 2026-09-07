import type StatusBadge from '@/components/StatusBadge';
import type React from 'react';

/** Human-readable label for an interview outcome code. */
export const outcomeLabel = (outcome?: string | null): string => {
  switch (outcome) {
    case 'pre_interview': return 'Ön Görüşme';
    case 'interview': return 'Görüşme';
    case 'decision_pending': return 'Karar bekleniyor';
    case 'hired': return 'İşe alım';
    case 'rejected_pre_interview': return 'Elendi (Ön Görüşme)';
    case 'rejected_interview': return 'Elendi (Görüşme)';
    case 'withdrawn': return 'Süreçten Çekildi';
    case 'pending': return 'Reserve edildi';
    case 'reserved': return 'Reserve edildi';
    case 'reserved_future_hire': return 'Reserve edildi';
    case 'different_account': return 'Farklı ekipte değerlendirilebilir';
    case 'rejected_other_team_possible': return 'Farklı ekipte değerlendirilebilir';
    case 'contact_for_slot': return 'Slot için İletişim';

    // Legacy values
    case 'passed': return 'Olumlu';
    case 'failed': return 'Olumsuz';
    case 'rejected': return 'Reddedildi';
    default:
      return outcome || '—';
  }
};

/** StatusBadge already maps outcome codes to variants; this only narrows the type. */
export const outcomeToStatus = (
  outcome?: string | null
): React.ComponentProps<typeof StatusBadge>['status'] =>
  (outcome || 'pending') as React.ComponentProps<typeof StatusBadge>['status'];
