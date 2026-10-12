import type { PreferenceGroup } from "~/types/preferences";

export const stepperItems: PreferenceGroup[] = [
  {
    title: "Où en es-tu ?",
    description:
      "Ton niveau décide du type de projets proposés. Tu pourras le changer à tout moment.",
    label: "Niveau",
    data: [
      {
        title: "Débutant",
        label: "beginner",
        description:
          "Je découvre l’open source. Je cherche des projets avec des good first issues, pensées pour une première contribution.",
        icon: "lucide:sprout",
      },
      {
        title: "Confirmé",
        label: "expert",
        description:
          "Je suis à l’aise sur des bases de code existantes. Je cherche des projets populaires qui ont besoin d’aide (help wanted).",
        icon: "lucide:layers",
      },
    ],
  },
  {
    title: "Avec quels langages ?",
    description:
      "Choisis ceux avec lesquels tu es à l’aise. Ton fil répartit les projets entre chacun d’eux.",
    label: "Langages",
    data: [
      { title: "JavaScript", label: "JS" },
      { title: "TypeScript", label: "TS" },
      { title: "Python", label: "PY" },
      { title: "Java", label: "JA" },
      { title: "C++", label: "C++" },
      { title: "C#", label: "C#" },
      { title: "Ruby", label: "RB" },
      { title: "Go", label: "GO" },
      { title: "Rust", label: "RS" },
      { title: "PHP", label: "PHP" },
      { title: "Swift", label: "SW" },
    ],
  },
  {
    title: "Tout est prêt",
    description: "Vérifie tes choix avant d’enregistrer. Ton fil se met à jour aussitôt.",
    label: "Récapitulatif",
    data: null,
  },
];
