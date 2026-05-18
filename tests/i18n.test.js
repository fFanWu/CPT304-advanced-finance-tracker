import { describe, it, expect, beforeEach } from "vitest";
import {
  initI18n,
  setLang,
  getLang,
  t,
  applyTranslations,
  loadLang,
  saveLang,
  LANG_KEY,
} from "../src/i18n/i18n.js";

const translations = {
  en: {
    greeting: "Hello",
    nav: { home: "Home", about: "About" },
    deep: { a: { b: { c: "Deep" } } },
    fallbackOnly: "Fallback string",
  },
  zh: {
    greeting: "你好",
    nav: { home: "首页", about: "关于" },
    deep: { a: { b: { c: "深层" } } },
  },
};

describe("i18n core", () => {
  beforeEach(() => {
    localStorage.clear();
    initI18n({ defaultLang: "en", translations });
  });

  it("initI18n defaults to 'en' and getLang reflects it", () => {
    expect(getLang()).toBe("en");
  });

  it("falls back to 'en' when defaultLang is unknown", () => {
    initI18n({ defaultLang: "fr", translations });
    expect(getLang()).toBe("en");
  });

  it("t() returns the active language string", () => {
    expect(t("greeting")).toBe("Hello");
    setLang("zh");
    expect(t("greeting")).toBe("你好");
  });

  it("t() supports nested 'a.b.c' keys", () => {
    expect(t("nav.home")).toBe("Home");
    expect(t("deep.a.b.c")).toBe("Deep");
  });

  it("t() returns the key itself when missing in both active and fallback", () => {
    expect(t("does.not.exist")).toBe("does.not.exist");
  });

  it("t() falls back to default-lang dictionary when active lang lacks the key", () => {
    setLang("zh");
    expect(t("fallbackOnly")).toBe("Fallback string");
  });

  it("setLang refuses unknown languages and keeps current", () => {
    const result = setLang("klingon");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("unknown-lang");
    expect(getLang()).toBe("en");
  });

  it("setLang persists the chosen language to localStorage", () => {
    setLang("zh");
    expect(localStorage.getItem(LANG_KEY)).toBe("zh");
    expect(loadLang()).toBe("zh");
  });

  it("loadLang returns null when nothing is stored", () => {
    expect(loadLang()).toBeNull();
  });

  it("saveLang writes the value and reports ok", () => {
    const result = saveLang("zh");
    expect(result.ok).toBe(true);
    expect(localStorage.getItem(LANG_KEY)).toBe("zh");
  });

  it("applyTranslations replaces textContent for [data-i18n] elements", () => {
    document.body.innerHTML = `
      <p data-i18n="greeting">placeholder</p>
      <span data-i18n="nav.home">x</span>
      <span data-i18n="missing.key">unchanged-key-fallback</span>
    `;
    applyTranslations(document);
    const ps = document.querySelectorAll("[data-i18n]");
    expect(ps[0].textContent).toBe("Hello");
    expect(ps[1].textContent).toBe("Home");
    expect(ps[2].textContent).toBe("missing.key");
  });

  it("applyTranslations sets attributes via [data-i18n-attr=\"attr:key\"]", () => {
    document.body.innerHTML = `
      <input data-i18n-attr="placeholder:greeting;aria-label:nav.about" />
    `;
    applyTranslations(document);
    const input = document.querySelector("input");
    expect(input.getAttribute("placeholder")).toBe("Hello");
    expect(input.getAttribute("aria-label")).toBe("About");
  });
});
