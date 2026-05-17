import { getConsent, setConsent, CONSENT_ACCEPTED, CONSENT_REJECTED } from "./consent.js";

export const hideBanner = (banner) => {
  if (!banner) return;
  banner.hidden = true;
  banner.classList.remove("is-visible");
  banner.setAttribute("aria-hidden", "true");
};

const showBanner = (banner) => {
  if (!banner) return;
  banner.hidden = false;
  banner.classList.add("is-visible");
  banner.setAttribute("aria-hidden", "false");
};

export const initBanner = ({ banner, acceptBtn, rejectBtn, onAccept, onReject } = {}) => {
  if (!banner || !acceptBtn || !rejectBtn) return;

  const current = getConsent();
  if (current === null) {
    showBanner(banner);
  } else {
    hideBanner(banner);
  }

  acceptBtn.addEventListener("click", () => {
    setConsent(CONSENT_ACCEPTED);
    hideBanner(banner);
    if (typeof onAccept === "function") onAccept();
  });

  rejectBtn.addEventListener("click", () => {
    setConsent(CONSENT_REJECTED);
    hideBanner(banner);
    if (typeof onReject === "function") onReject();
  });
};
