import { describe, it, expect, beforeEach } from "vitest";
import {
  CONSENT_KEY,
  CONSENT_ACCEPTED,
  CONSENT_REJECTED,
  getConsent,
  setConsent,
  hasConsented,
} from "../src/consent/consent.js";

describe("consent module", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no consent has been set", () => {
    expect(getConsent()).toBeNull();
    expect(hasConsented()).toBe(false);
  });

  it("setConsent('accepted') persists and is reflected by getConsent/hasConsented", () => {
    const result = setConsent(CONSENT_ACCEPTED);
    expect(result).toEqual({ ok: true });
    expect(localStorage.getItem(CONSENT_KEY)).toBe(CONSENT_ACCEPTED);
    expect(getConsent()).toBe(CONSENT_ACCEPTED);
    expect(hasConsented()).toBe(true);
  });

  it("setConsent('rejected') persists but hasConsented stays false", () => {
    const result = setConsent(CONSENT_REJECTED);
    expect(result).toEqual({ ok: true });
    expect(getConsent()).toBe(CONSENT_REJECTED);
    expect(hasConsented()).toBe(false);
  });

  it("rejects invalid values without writing to localStorage", () => {
    const result = setConsent("maybe");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid-value");
    expect(localStorage.getItem(CONSENT_KEY)).toBeNull();
    expect(getConsent()).toBeNull();
  });

  it("getConsent returns null if a foreign value is somehow stored", () => {
    localStorage.setItem(CONSENT_KEY, "garbage");
    expect(getConsent()).toBeNull();
    expect(hasConsented()).toBe(false);
  });

  it("can switch from accepted to rejected", () => {
    setConsent(CONSENT_ACCEPTED);
    expect(hasConsented()).toBe(true);
    setConsent(CONSENT_REJECTED);
    expect(getConsent()).toBe(CONSENT_REJECTED);
    expect(hasConsented()).toBe(false);
  });

  it("hasConsented is strictly true only for 'accepted'", () => {
    expect(hasConsented()).toBe(false);
    setConsent(CONSENT_REJECTED);
    expect(hasConsented()).toBe(false);
    setConsent(CONSENT_ACCEPTED);
    expect(hasConsented()).toBe(true);
  });
});
