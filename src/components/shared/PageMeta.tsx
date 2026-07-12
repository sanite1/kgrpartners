import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description?: string;
}

const setMeta = (attr: "name" | "property", key: string, content: string) => {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const PageMeta = ({ title, description }: PageMetaProps) => {
  useEffect(() => {
    document.title = title;
    setMeta("property", "og:title", title);
    setMeta("name", "twitter:title", title);
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("name", "twitter:description", description);
    }
  }, [title, description]);

  return null;
};

export default PageMeta;
