const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

export const timeAgo = (dateString: string) => {
  if (!dateString) return "";
  const diffInMs = new Date(dateString).getTime() - Date.now();
  const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));

  if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, "hour");
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  return rtf.format(diffInDays, "day");
};

const AVATAR_COLORS: Record<string, string> = {
  typescript: "bg-linear-to-br from-[#3178C6] to-[#133051]",
  javascript: "bg-linear-to-br from-[#F7DF1E] to-[#7F6F0D]",
  python: "bg-linear-to-br from-[#3776AB] to-[#163047]",
  rust: "bg-linear-to-br from-[#CE412B] to-[#691F15]",
  go: "bg-linear-to-br from-[#00ADD8] to-[#005870]",
  "c++": "bg-linear-to-br from-[#00599C] to-[#002C4E]",
  php: "bg-linear-to-br from-[#777BB4] to-[#3E3E5D]",
  java: "bg-linear-to-br from-[#ED8B00] to-[#794600]",
  kotlin: "bg-linear-to-br from-[#7F52FF] to-[#402980]",
  swift: "bg-linear-to-br from-[#F05138] to-[#7F291D]",
  dart: "bg-linear-to-br from-[#0175C2] to-[#013B63]",
  ruby: "bg-linear-to-br from-[#CC342D] to-[#671A17]",
};

export const getAvatarColor = (language: string) => {
  return AVATAR_COLORS[language?.toLowerCase()] || "bg-gray-500/20 text-gray-400";
};

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${day}-${month}-${d.getFullYear()}`;
};

export const formatCompact = (n: number) => {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n).toLowerCase();
};
