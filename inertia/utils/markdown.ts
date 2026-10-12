const isAbsolute = (url: string) => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url);

/**
 * READMEs reference images and documents relative to the repository root.
 * Rewrite them so they resolve on GitHub instead of on Gitify.
 */
export function absolutizeMarkdown(
  markdown: string,
  repo: { ownerName: string; name: string; branch?: string | null },
) {
  const ref = repo.branch ?? "HEAD";
  const path = (url: string) => url.replace(/^\.?\//, "");
  const raw = (url: string) =>
    `https://raw.githubusercontent.com/${repo.ownerName}/${repo.name}/${ref}/${path(url)}`;
  const blob = (url: string) =>
    `https://github.com/${repo.ownerName}/${repo.name}/blob/${ref}/${path(url)}`;

  return markdown
    .replace(
      /(!?)\[([^\]]*)\]\(\s*<?([^)\s>]+)>?((?:\s+"[^"]*")?)\s*\)/g,
      (match, bang, text, url, title) =>
        isAbsolute(url) ? match : `${bang}[${text}](${bang ? raw(url) : blob(url)}${title})`,
    )
    .replace(/(<img\b[^>]*?\bsrc=)(["'])([^"']+)\2/gi, (match, prefix, quote, url) =>
      isAbsolute(url) ? match : `${prefix}${quote}${raw(url)}${quote}`,
    )
    .replace(/(<a\b[^>]*?\bhref=)(["'])([^"']+)\2/gi, (match, prefix, quote, url) =>
      isAbsolute(url) ? match : `${prefix}${quote}${blob(url)}${quote}`,
    );
}
