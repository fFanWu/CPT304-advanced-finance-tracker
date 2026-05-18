import { beforeEach, describe, expect, it, vi } from "vitest";

const consentMocks = vi.hoisted(() => ({
  getConsent: vi.fn(),
  setConsent: vi.fn(),
}));

vi.mock("../src/consent/consent.js", () => ({
  getConsent: consentMocks.getConsent,
  setConsent: consentMocks.setConsent,
  CONSENT_ACCEPTED: "accepted",
  CONSENT_REJECTED: "rejected",
}));

import { hideBanner, initBanner } from "../src/consent/banner.js";

const createDom = () => {
  const banner = document.createElement("div");
  banner.hidden = true;
  banner.setAttribute("aria-hidden", "true");
  const acceptBtn = document.createElement("button");
  const rejectBtn = document.createElement("button");
  return { banner, acceptBtn, rejectBtn };
};

describe("banner module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hideBanner is a no-op when banner is null", () => {
    expect(() => hideBanner(null)).not.toThrow();
  });

  it("initBanner is a no-op when dom elements are missing", () => {
    expect(() => initBanner({})).not.toThrow();
    expect(() => initBanner()).not.toThrow();
  });

  it("hideBanner hides and marks banner as hidden", () => {
    const { banner } = createDom();
    banner.hidden = false;
    banner.classList.add("is-visible");
    banner.setAttribute("aria-hidden", "false");

    hideBanner(banner);

    expect(banner.hidden).toBe(true);
    expect(banner.classList.contains("is-visible")).toBe(false);
    expect(banner.getAttribute("aria-hidden")).toBe("true");
  });

  it("initBanner shows banner when consent is missing", () => {
    const { banner, acceptBtn, rejectBtn } = createDom();
    consentMocks.getConsent.mockReturnValue(null);

    initBanner({ banner, acceptBtn, rejectBtn });

    expect(banner.hidden).toBe(false);
    expect(banner.classList.contains("is-visible")).toBe(true);
    expect(banner.getAttribute("aria-hidden")).toBe("false");
  });

  it("initBanner hides banner when consent already exists", () => {
    const { banner, acceptBtn, rejectBtn } = createDom();
    consentMocks.getConsent.mockReturnValue("accepted");
    banner.hidden = false;
    banner.classList.add("is-visible");
    banner.setAttribute("aria-hidden", "false");

    initBanner({ banner, acceptBtn, rejectBtn });

    expect(banner.hidden).toBe(true);
    expect(banner.classList.contains("is-visible")).toBe(false);
    expect(banner.getAttribute("aria-hidden")).toBe("true");
  });

  it("accept click stores accepted consent, hides banner and calls onAccept", () => {
    const { banner, acceptBtn, rejectBtn } = createDom();
    consentMocks.getConsent.mockReturnValue(null);
    const onAccept = vi.fn();

    initBanner({ banner, acceptBtn, rejectBtn, onAccept });
    acceptBtn.click();

    expect(consentMocks.setConsent).toHaveBeenCalledWith("accepted");
    expect(banner.hidden).toBe(true);
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("reject click stores rejected consent, hides banner and calls onReject", () => {
    const { banner, acceptBtn, rejectBtn } = createDom();
    consentMocks.getConsent.mockReturnValue(null);
    const onReject = vi.fn();

    initBanner({ banner, acceptBtn, rejectBtn, onReject });
    rejectBtn.click();

    expect(consentMocks.setConsent).toHaveBeenCalledWith("rejected");
    expect(banner.hidden).toBe(true);
    expect(onReject).toHaveBeenCalledTimes(1);
  });
});
