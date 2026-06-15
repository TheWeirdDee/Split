export interface QuickSplitPayload {
  total: number;
  people: string[];
  paidBy: string;
  equalSplit: boolean;
  customAmounts: Record<string, number>;
  createdAt: number;
}

const toBase64 = (value: string) => {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(unescape(encodeURIComponent(value)));
  }
  return Buffer.from(value, 'utf8').toString('base64');
};

const fromBase64 = (value: string) => {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return decodeURIComponent(escape(window.atob(value)));
  }
  return Buffer.from(value, 'base64').toString('utf8');
};

const encodeSafeBase64 = (value: string) => {
  return toBase64(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const decodeSafeBase64 = (value: string) => {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return fromBase64(base64);
};

export const serializeQuickSplit = (payload: QuickSplitPayload) => {
  return encodeSafeBase64(JSON.stringify(payload));
};

export const deserializeQuickSplit = (encoded: string): QuickSplitPayload | null => {
  try {
    const json = decodeSafeBase64(encoded);
    const parsed = JSON.parse(json) as QuickSplitPayload;
    if (!parsed || typeof parsed !== 'object') return null;
    // Validate required shape so malformed links don't crash downstream consumers
    if (typeof parsed.total !== 'number' || !Array.isArray(parsed.people)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const calculateSplit = (payload: QuickSplitPayload) => {
  const debts = payload.people
    .filter((name) => name !== payload.paidBy)
    .map((name) => {
      const amount = payload.equalSplit
        ? payload.total / payload.people.length
        : payload.customAmounts[name] ?? 0;

      return {
        from: name,
        to: payload.paidBy,
        amount,
      };
    });

  return debts;
};
