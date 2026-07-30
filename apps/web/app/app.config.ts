export default defineAppConfig({
  ui: {
    colors: {
      primary: "orange",
      secondary: "green",
      neutral: "gray",
    },
    button: {
      slots: {
        base: "cursor-pointer !px-2.5 !py-1.5 !text-sm md:!text-base md:!px-3 md:!py-2",
        leadingIcon: "!size-5",
      },
      variants: {
        color: {
          brand:
            "text-white bg-primary rounded-sm hover:bg-primary/75 active:bg-primary/75 disabled:bg-primary aria-disabled:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          secondary:
            "!text-brand-green !bg-surface-strong rounded-sm border border-border hover:!bg-surface active:!bg-surface disabled:!bg-surface-strong aria-disabled:!bg-surface-strong focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-border",
          yellow:
            "!text-yellow-500 !bg-yellow-500/10 rounded-sm border border-yellow-500/30 hover:!bg-yellow-500/20 active:!bg-yellow-500/75 focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-yellow-500/10",
        },
      },
    },
    pageHero: {
      slots: {
        container: "!py-8 !px-0 md:py-16",
        wrapper: "flex flex-col gap-10",
      },
    },
    dropdownMenu: {
      slots: {
        content: "text-ink border border-border bg-canvas shadow-xl",
        group: "p-1 isolate",
        label: "w-full flex items-center font-semibold text-muted px-2 py-1.5",
        separator: "-mx-1 my-1 h-px bg-border",
        item: "group relative w-full flex items-center select-none outline-none text-ink data-[highlighted]:bg-surface data-[highlighted]:text-ink rounded-md p-1.5 data-disabled:cursor-not-allowed data-disabled:opacity-50 transition-colors",
        itemLeadingIcon: "shrink-0 text-muted group-data-[highlighted]:text-ink",
        itemLeadingAvatar: "shrink-0",
        itemLeadingAvatarSize: "",
        itemTrailing: "ms-auto inline-flex gap-1.5 items-center",
        itemTrailingIcon: "shrink-0 text-muted group-data-[highlighted]:text-ink",
        itemWrapper: "flex-1 flex flex-col text-start min-w-0 cursor-pointer",
        itemLabel: "truncate text-brand-green",
        itemDescription: "truncate text-muted",
        itemLabelExternalIcon: "inline-block size-3 align-top text-muted",
      },
      compoundVariants: [
        {
          color: "error",
          active: false,
          class: {
            item: "text-red-700 data-[highlighted]:bg-red-500/15 data-[highlighted]:text-red-700",
            itemLeadingIcon: "text-red-700/70 group-data-[highlighted]:text-red-700",
            itemLabel: "text-red-700",
            itemTrailingIcon: "text-red-700/70 group-data-[highlighted]:text-red-700",
          },
        },
      ],
    },
    navigationMenu: {
      slots: {
        link: "!text-ink hover:!text-muted",
      },
    },
    pageCard: {
      slots: {
        root: "relative !ring-0 rounded-lg overflow-hidden",
        container: "flex flex-col h-full bg-surface",
        header: "mb-4",
        body: "flex-1",
        footer: "pt-4 mt-auto",
        leading: "inline-flex items-center justify-center p-2.5 rounded-md mb-5",
        leadingIcon: "size-6",
        title: "text-ink font-mono text-lg font-bold tracking-wide mb-2.5",
        description: "text-muted text-sm leading-relaxed font-sans",
      },
    },
    card: {
      slots: {
        root: "!bg-surface border !border-border",
        header: "p-4 sm:px-6",
        title: "text-highlighted font-semibold",
        description: "mt-1 text-muted text-sm",
        body: "h-full flex flex-col justify-between !p-4 sm:p-6",
        footer: "p-4 sm:px-6",
      },
    },
    input: {
      slots: {
        base: "!bg-canvas border border-control hover:!bg-surface focus:!bg-canvas transition-all duration-200 rounded-xl text-ink placeholder:text-muted",
        leadingIcon: "text-brand-green",
        trailingIcon: "text-brand-green",
      },
    },
    select: {
      slots: {
        base: "!bg-canvas border border-control hover:!bg-surface transition-all duration-200 rounded-xl cursor-pointer",
        value: "text-ink font-medium",
        placeholder: "text-muted",
        leadingIcon: "text-brand-green",
        trailingIcon: "text-brand-green",
        content: "bg-canvas ring-1 ring-border shadow-2xl rounded-xl",
        viewport: "p-1",
        item: "text-ink data-highlighted:not-data-disabled:text-ink data-highlighted:not-data-disabled:before:bg-surface transition-colors before:rounded-md cursor-pointer",
        itemLeadingIcon:
          "text-muted group-data-highlighted:not-group-data-disabled:text-ink transition-colors",
        empty: "text-muted text-sm py-4 font-mono text-center",
      },
    },
    selectMenu: {
      slots: {
        base: "!bg-canvas border border-control hover:!bg-surface transition-all duration-200 rounded-xl cursor-pointer",
        value: "text-ink font-medium",
        placeholder: "text-muted",
        leadingIcon: "text-brand-green",
        trailingIcon: "text-brand-green",
        content: "bg-canvas ring-1 ring-border shadow-2xl rounded-xl",
        viewport: "p-1",
        item: "text-ink data-highlighted:not-data-disabled:text-ink data-highlighted:not-data-disabled:before:bg-surface transition-colors before:rounded-md cursor-pointer",
        itemLeadingIcon:
          "text-muted group-data-highlighted:not-group-data-disabled:text-ink transition-colors",
        input: "border-b border-border text-ink placeholder-muted bg-transparent py-2",
        empty: "text-muted text-sm py-4 font-mono text-center",
      },
    },
    separator: {
      slots: {
        border: "!border-border",
      },
    },
    badge: {
      variants: {
        color: {
          primary:
            "text-jetbrains text-sm text-primary bg-primary/20 !px-3 !py-1.5 !rounded-sm border border-primary !ring-0",
          secondary:
            "text-jetbrains text-sm !text-ink !bg-canvas !px-3 !py-1.5 !rounded-sm border border-green-500/20",
        },
      },
    },
    tooltip: {
      slots: {
        content: "bg-canvas border border-green-500/20 ring-0",
      },
    },
    checkbox: {
      slots: {
        base: "!rounded-xs cursor-pointer",
        indicator: "!bg-red-500",
        icon: "hidden",
        label: "!text-brand-green capitalize",
      },
    },
    skeleton: {
      base: "!bg-surface",
    },
    prose: {
      pre: {
        slots: {
          copy: "absolute top-2 right-2 lg:opacity-0 lg:group-hover:opacity-100 transition !p-1 !min-h-0 !size-7 !gap-0",
        },
      },
    },
  },
});
