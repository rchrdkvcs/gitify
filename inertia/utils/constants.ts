import { ref } from "vue";

export const featuresItems = ref([
  {
    title: "Sélection d'issues",
    description:
      "Des tâches triées sur le volet et spécialement taguées pour les débutants. Fini de fouiller dans des backlogs interminables.",
    icon: "lucide:bug",
    wrapperClass: "bg-[#EF4D31]/20",
    iconColorClass: "!text-[#EF4D31]",
    bgClass:
      "before:absolute before:-top-10 before:-right-10 before:size-40 before:bg-[#EF4D31]/30 before:blur-3xl before:rounded-full before:pointer-events-none",
  },
  {
    title: "Culture du mentorat",
    description:
      "Échangez avec des devs seniors prêts à vous accompagner vers votre première contribution significative.",
    icon: "lucide:users",
    wrapperClass: "bg-[#F1BE37]/20",
    iconColorClass: "!text-[#F1BE37]",
    bgClass:
      "before:absolute before:-top-10 before:-right-10 before:size-40 before:bg-[#F1BE37]/30 before:blur-3xl before:rounded-full before:pointer-events-none",
  },
  {
    title: "Générateur de portfolio",
    description:
      "Créez automatiquement une vitrine de vos PR fusionnées pour impressionner vos futurs employeurs.",
    icon: "lucide:briefcase",
    wrapperClass: "bg-[#ADECEF]/20",
    iconColorClass: "!text-[#ADECEF]",
    bgClass:
      "before:absolute before:-top-10 before:-right-10 before:size-40 before:bg-[#ADECEF]/30 before:blur-3xl before:rounded-full before:pointer-events-none",
  },
]);

export const stepperItems = ref([
  {
    title: "Quel est votre niveau ?",
    description:
      "Afin de vous proposer les issues et les projets les plus adaptés, dites-nous où vous en êtes dans votre parcours de développeur.",
    label: "Niveau",
    data: [
      {
        title: "Débutant",
        label: "beginner",
        description:
          'Je découvre le développement ou l\'open source. Je cherche des "Good First Issues" simples.',
        icon: "tabler:leaf",
      },
      {
        title: "Expert",
        label: "expert",
        description:
          "Je maîtrise l'architecture logicielle. Je peux mentorer ou m'attaquer à des problèmes complexes d'optimisation.",
        icon: "mdi:tools",
      },
    ],
  },
  {
    title: "Quels sont vos langages favoris ?",
    description:
      'Sélectionnez les technologies avec lesquelles vous êtes le plus à l\'aise. Cela nous aidera à vous recommander des "Good First Issues" pertinentes.',
    label: "Langages",
    data: [
      {
        title: "JavaScript",
        label: "Js",
      },
      {
        title: "TypeScript",
        label: "Ts",
      },
      {
        title: "Python",
        label: "Py",
      },
      {
        title: "Java",
        label: "Ja",
      },
      { title: "C++" },
      { title: "C#" },
      {
        title: "Ruby",
        label: "Ru",
      },
      { title: "Go" },
      {
        title: "Rust",
        label: "Rs",
      },
      { title: "Php" },
      {
        title: "Swift",
        label: "Sf",
      },
    ],
  },
  {
    title: "Prêt à commencer ?",
    description:
      "Vérifiez les informations de votre profil. C'est ce que la communauté verra lorsque vous contribuerez à des projets open source.",
    label: "Finalisation",
    data: null,
  },
]);
