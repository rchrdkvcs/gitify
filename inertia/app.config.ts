const graphiteRampTypedAsTailwindNeutral = "graphite" as "neutral";
const preventIosFocusZoomOnMobile = "max-sm:text-base";

export default {
  ui: {
    colors: {
      primary: "mint",
      success: "mint",
      neutral: graphiteRampTypedAsTailwindNeutral,
    },
    button: {
      slots: {
        base: "cursor-pointer font-medium transition-[background-color,color,border-color,scale] duration-150 active:scale-[0.96]",
      },
      compoundVariants: [
        {
          color: "neutral",
          variant: "outline",
          class: "ring-accented bg-default hover:bg-elevated",
        },
      ],
    },
    avatar: {
      slots: {
        root: "rounded-none",
      },
    },
    badge: {
      slots: {
        base: "font-mono tracking-normal",
      },
    },
    card: {
      slots: {
        root: "bg-default ring-default",
      },
    },
    header: {
      slots: {
        root: "bg-default/80 backdrop-blur border-b border-default",
      },
    },
    dropdownMenu: {
      slots: {
        content: "min-w-52",
      },
    },
    input: {
      slots: {
        base: `bg-default ${preventIosFocusZoomOnMobile}`,
      },
    },
    tooltip: {
      slots: {
        content: "font-mono text-xs",
      },
    },
  },
};
