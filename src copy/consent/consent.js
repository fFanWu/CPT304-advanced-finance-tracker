export const CONSENT_KEY = "financeTrackerConsent";
export const CONSENT_ACCEPTED = "accepted";
export const CONSENT_REJECTED = "rejected";

const VALID_VALUES = new Set([CONSENT_ACCEPTED, CONSENT_REJECTED]);

export const getConsent = () => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw === null) return null;
    return VALID_VALUES.has(raw) ? raw : null;
  } catch {
    return null;
  }
};

export const setConsent = (value) => {
  if (!VALID_VALUES.has(value)) {
    return { ok: false, error: "invalid-value" };
  }
  try {
    localStorage.setItem(CONSENT_KEY, value);
    return { ok: true };
  } catch {
    return { ok: false, error: "unknown" };
  }
};

export const hasConsented = () => getConsent() === CONSENT_ACCEPTED;
