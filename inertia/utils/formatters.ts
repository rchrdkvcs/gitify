import { formatLanguageName } from "@shared/preferences";
const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

export const timeAgo = (dateString: string | null) => {
  if (!dateString) return "";
  const diffInMs = new Date(dateString).getTime() - Date.now();
  const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));

  if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, "hour");
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  return rtf.format(diffInDays, "day");
};

export const formatDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${day}-${month}-${d.getFullYear()}`;
};

export const formatCompact = (n: number) => {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n).toLowerCase();
};

// Languages are stored lowercase; this restores their usual spelling.
export const formatLanguage = (language: string | null) => {
  if (!language) return "";
  return formatLanguageName(language);
};
