import {ref} from "vue";

export const featuresItems = ref([
    {
        title: "Sélection d'issues",
        description:
            "Des tâches triées sur le volet et spécialement taguées pour les débutants. Fini de fouiller dans des backlogs interminables.",
        icon: "lucide:bug",
        wrapperClass: "bg-[#EF4D31]/20",
        iconColorClass: "!text-[#EF4D31]",
        bgClass: "before:absolute before:-top-10 before:-right-10 before:size-40 before:bg-[#EF4D31]/30 before:blur-3xl before:rounded-full before:pointer-events-none"
    },
    {
        title: "Culture du mentorat",
        description:
            "Échangez avec des devs seniors prêts à vous accompagner vers votre première contribution significative.",
        icon: "lucide:users",
        wrapperClass: "bg-[#F1BE37]/20",
        iconColorClass: "!text-[#F1BE37]",
        bgClass: "before:absolute before:-top-10 before:-right-10 before:size-40 before:bg-[#F1BE37]/30 before:blur-3xl before:rounded-full before:pointer-events-none"
    },
    {
        title: "Générateur de portfolio",
        description:
            "Créez automatiquement une vitrine de vos PR fusionnées pour impressionner vos futurs employeurs.",
        icon: "lucide:briefcase",
        wrapperClass: "bg-[#ADECEF]/20",
        iconColorClass: "!text-[#ADECEF]",
        bgClass: "before:absolute before:-top-10 before:-right-10 before:size-40 before:bg-[#ADECEF]/30 before:blur-3xl before:rounded-full before:pointer-events-none"
    },
]);