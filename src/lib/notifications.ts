type NotificationType =
  | 'reminder'
  | 'payment'
  | 'join'
  | 'expense'
  | 'system'
  | 'message'
  | 'settlement'
  | 'group_joined'
  | 'nudge_broom'
  | 'nudge_runner'
  | 'nudge_bell';

interface CreateNotificationInput {
  userAddress: string;
  groupId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  actor?: string | null;
  actionUrl?: string | null;
}

type CreateNotificationResult =
  | { sent: true }
  | { sent: false; reason: 'preference_disabled' | 'quiet_hours' | 'error' | 'bad_request' };

/**
 * Creates a notification via the server endpoint (`/api/notifications`), which
 * runs with the service-role key and enforces recipient preferences / quiet
 * hours. Routing inserts through the server lets the `notifications` table be
 * locked down so the public anon key can't forge notifications directly.
 *
 * Never throws — returns a `{ sent, reason }` result so fire-and-forget callers
 * stay safe.
 */
export const createNotificationSafe = async (
  input: CreateNotificationInput
): Promise<CreateNotificationResult> => {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return { sent: false, reason: 'error' };
    return (await res.json()) as CreateNotificationResult;
  } catch {
    return { sent: false, reason: 'error' };
  }
};
