/** Reasons offered when someone deletes their account (design: "Tell us why you're leaving"). */
export const DELETION_REASONS = [
  { value: 'unsatisfied', label: 'Unsatisfied with the product experience' },
  { value: 'not-using', label: 'I’m not using Memento AI enough' },
  { value: 'issues-unresolved', label: 'My issues with Memento were not resolved' },
  { value: 'safety-privacy', label: 'Safety or privacy concerns' },
  { value: 'taking-break', label: 'I’m taking a break' },
  { value: 'other', label: 'Something else' },
  { value: 'cant-say', label: 'Can’t say for now' },
] as const;

export type DeletionReason = (typeof DELETION_REASONS)[number]['value'];

export const DELETE_CONFIRMATION_WORD = 'DELETE';

export function deletionReasonLabel(reason: DeletionReason | null) {
  return DELETION_REASONS.find((item) => item.value === reason)?.label ?? 'No reason';
}

/** The final step unlocks only when the word is typed exactly (case-sensitive, trimmed). */
export function isDeletionConfirmed(text: string) {
  return text.trim() === DELETE_CONFIRMATION_WORD;
}

/** "groot***gmail.com"-style mask so the email can be shown without spelling it out. */
export function maskEmail(email?: string | null) {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0, Math.min(5, Math.max(1, name.length - 1)))}***${domain}`;
}

export interface DeleteAccountPayload {
  reason?: DeletionReason;
  details?: string;
  export_data?: boolean;
}

export function buildDeleteAccountPayload(input: {
  reason: DeletionReason | null;
  details: string;
  exportData: boolean;
}): DeleteAccountPayload {
  const payload: DeleteAccountPayload = { export_data: input.exportData };
  if (input.reason) payload.reason = input.reason;
  const details = input.details.trim();
  if (input.reason === 'other' && details) payload.details = details.slice(0, 1000);
  return payload;
}
