export const LANG_KEY = "financeTrackerLang";
export const DEFAULT_LANG = "en";

let currentLang = DEFAULT_LANG;
let dictionaries = {};

const lookup = (dict, key) => {
  if (!dict || typeof key !== "string" || key.length === 0) return undefined;
  const segments = key.split(".");
  let cursor = dict;
  for (const seg of segments) {
    if (cursor && typeof cursor === "object" && seg in cursor) {
      cursor = cursor[seg];
    } else {
      return undefined;
    }
  }
  return typeof cursor === "string" ? cursor : undefined;
};

export const initI18n = ({ defaultLang = DEFAULT_LANG, translations = {} } = {}) => {
  dictionaries = translations || {};
  currentLang = dictionaries[defaultLang] ? defaultLang : DEFAULT_LANG;
};

export const getLang = () => currentLang;

export const setLang = (lang) => {
  if (!dictionaries[lang]) {
    return { ok: false, error: "unknown-lang" };
  }
  currentLang = lang;
  saveLang(lang);
  return { ok: true };
};

export const t = (key) => {
  const active = lookup(dictionaries[currentLang], key);
  if (active !== undefined) return active;
  if (currentLang !== DEFAULT_LANG) {
    const fallback = lookup(dictionaries[DEFAULT_LANG], key);
    if (fallback !== undefined) return fallback;
  }
  return key;
};

export const applyTranslations = (root) => {
  if (!root || typeof root.querySelectorAll !== "function") return;

  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });

  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const spec = el.getAttribute("data-i18n-attr");
    if (!spec) return;
    spec.split(";").forEach((pair) => {
      const [attr, key] = pair.split(":").map((s) => s && s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
};

export const loadLang = () => {
  try {
    const raw = localStorage.getItem(LANG_KEY);
    return typeof raw === "string" && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
};

export const saveLang = (lang) => {
  try {
    localStorage.setItem(LANG_KEY, lang);
    return { ok: true };
  } catch {
    return { ok: false };
  }
};
