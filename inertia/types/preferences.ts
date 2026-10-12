export interface Preference {
  title: string;
  value?: string;
  label?: string | undefined;
  description?: string | undefined;
  icon?: string | undefined;
}

export interface PreferenceGroup {
  title: string;
  description: string;
  label: string;
  data: Preference[] | null;
}
