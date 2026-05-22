import { useEffect } from "react";
import { useI18n } from "../context/I18nContext";

const SITE_NAME = "MedElite";
const SITE_URL = "https://med-liteuz.vercel.app";
const DEFAULT_IMAGE = `${SITE_URL}/medelite-favicon.svg`;

type SeoProps = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  keywords?: string;
  structuredData?: Record<string, unknown>;
};

const localeMap = {
  uz: "uz_UZ",
  ru: "ru_RU",
  en: "en_US",
} as const;

const languageMap = {
  uz: "uz",
  ru: "ru",
  en: "en",
} as const;

const ensureMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

const ensureLink = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

const Seo = ({ title, description, path = "/", noIndex = false, keywords, structuredData }: SeoProps) => {
  const { language } = useI18n();

  useEffect(() => {
    const canonicalUrl = new URL(path, SITE_URL).toString();
    document.title = title;
    document.documentElement.lang = languageMap[language];

    ensureMeta('meta[name="description"]', { name: "description", content: description });
    ensureMeta('meta[name="robots"]', {
      name: "robots",
      content: noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    });
    ensureMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    ensureMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: title });
    ensureMeta('meta[property="og:description"]', { property: "og:description", content: description });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    ensureMeta('meta[property="og:image"]', { property: "og:image", content: DEFAULT_IMAGE });
    ensureMeta('meta[property="og:locale"]', { property: "og:locale", content: localeMap[language] });
    ensureMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary" });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    ensureMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: DEFAULT_IMAGE });
    ensureLink('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });

    if (keywords) {
      ensureMeta('meta[name="keywords"]', { name: "keywords", content: keywords });
    }

    let structuredDataNode = document.head.querySelector<HTMLScriptElement>('script[data-seo="structured-data"]');

    if (structuredData) {
      if (!structuredDataNode) {
        structuredDataNode = document.createElement("script");
        structuredDataNode.type = "application/ld+json";
        structuredDataNode.dataset.seo = "structured-data";
        document.head.appendChild(structuredDataNode);
      }

      structuredDataNode.textContent = JSON.stringify(structuredData);
    } else if (structuredDataNode) {
      structuredDataNode.remove();
    }
  }, [description, keywords, language, noIndex, path, structuredData, title]);

  return null;
};

export { SITE_NAME, SITE_URL };
export default Seo;
