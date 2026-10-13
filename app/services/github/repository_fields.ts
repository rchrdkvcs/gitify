export type LicenseInfo = { spdxId: string | null; name: string } | null | undefined;

export function licenseName(license: LicenseInfo): string | null {
  if (!license) {
    return null;
  }
  return license.spdxId && license.spdxId !== "NOASSERTION" ? license.spdxId : license.name;
}

export function homepageUrl(homepage: string | null | undefined): string | null {
  return homepage?.trim() || null;
}
