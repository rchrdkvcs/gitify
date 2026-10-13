import { formatLanguageName } from "@shared/preferences";
const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

const timeAgo = (dateString: string) => {
  const diffInMs = new Date(dateString).getTime() - Date.now();
  const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));

  if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, "hour");
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  return rtf.format(diffInDays, "day");
};

export const formatCompact = (n: number) => {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n).toLowerCase();
};

export const formatLanguage = (language: string | null) => {
  if (!language) return "";
  return formatLanguageName(language);
};

export const projectPath = (project: { ownerName: string; name: string }) =>
  `/projects/${encodeURIComponent(project.ownerName)}/${encodeURIComponent(project.name)}`;

export const avatarUrl = (url: string, size = 80) =>
  url.includes("avatars.githubusercontent.com")
    ? `${url}${url.includes("?") ? "&" : "?"}s=${size}`
    : url;

export const formatNumber = (n: number) => n.toLocaleString("fr-FR");

export const formatSize = (kb: number) => {
  if (kb < 1024) return `${kb} Ko`;
  const mb = kb / 1024;
  if (mb < 1024)
    return `${mb.toLocaleString("fr-FR", { maximumFractionDigits: mb < 10 ? 1 : 0 })} Mo`;
  return `${(mb / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Go`;
};

export const timeSince = (iso: string | null) => {
  if (!iso) return "";
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (Math.abs(days) < 1) return timeAgo(iso);
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), "month");
  return rtf.format(Math.round(days / 365), "year");
};
