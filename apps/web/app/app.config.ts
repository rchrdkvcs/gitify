export default defineAppConfig({
  ui: {
    colors: {
      primary: "orange",
      secondary: "green",
      neutral: "gray",
    },
    button: {
      slots: {
        base: "cursor-pointer",
      },
      variants: {
        color: {
          brand: "text-light bg-primary rounded-sm hover:bg-primary/75 active:bg-primary/75 disabled:bg-primary aria-disabled:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          secondary: "!text-lightgreen !bg-darkgreen rounded-sm border border-lightgreen/10 hover:!bg-darkgreen/75 active:!bg-darkgreen/75 disabled:!bg-darkgreen aria-disabled:!bg-darkgreen focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-darkgreen",
        }
      }
    },
    pageHero: {
      slots: {
        wrapper: 'flex flex-col gap-10',
      },
    },
    dropdownMenu: {
      slots: {
        content: 'bg-dark-green text-white border border-lightgreen/10 bg-darkgreen shadow-xl',
        group: 'p-1 isolate',
        label: 'w-full flex items-center font-semibold text-white/70 px-2 py-1.5',
        separator: '-mx-1 my-1 h-px bg-white/20',
        item: 'group relative w-full flex items-center select-none outline-none text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white rounded-md p-1.5 data-disabled:cursor-not-allowed data-disabled:opacity-50 transition-colors',
        itemLeadingIcon: 'shrink-0 text-white/80 group-data-[highlighted]:text-white',
        itemLeadingAvatar: 'shrink-0',
        itemLeadingAvatarSize: '',
        itemTrailing: 'ms-auto inline-flex gap-1.5 items-center',
        itemTrailingIcon: 'shrink-0 text-white/80 group-data-[highlighted]:text-white',
        itemWrapper: 'flex-1 flex flex-col text-start min-w-0 cursor-pointer',
        itemLabel: 'truncate text-lightgreen',
        itemDescription: 'truncate text-white/60',
        itemLabelExternalIcon: 'inline-block size-3 align-top text-white/60'
      }
    },
    navigationMenu: {
      slots: {
        link: '!text-light hover:!text-lightgray',
      }
    },
    pageCard: {
      slots: {
        root: 'relative !ring-0 rounded-lg overflow-hidden',
        container: 'flex flex-col h-full bg-[#041410]',
        header: 'mb-4',
        body: 'flex-1',
        footer: 'pt-4 mt-auto',
        leading: 'inline-flex items-center justify-center p-2.5 rounded-md mb-5',
        leadingIcon: 'size-6',
        title: 'text-white font-mono text-lg font-bold tracking-wide mb-2.5',
        description: 'text-gray-400 text-sm leading-relaxed font-sans'
      }
    },
    card: {
      slots: {
        root: '!bg-card/20 border !border-card/20',
        header: 'p-4 sm:px-6',
        title: 'text-highlighted font-semibold',
        description: 'mt-1 text-muted text-sm',
        body: 'h-full flex flex-col justify-between !p-4 sm:p-6',
        footer: 'p-4 sm:px-6'
      },
    },
    selectMenu: {
      slots: {
        base: '!bg-darkgreen border border-lightgreen/10 hover:!bg-darkgreen/75 transition-all duration-200 rounded-xl cursor-pointer',
        value: 'text-lightgreen font-medium',
        placeholder: 'text-lightgray',
        leadingIcon: 'text-lightgreen',
        trailingIcon: 'text-lightgreen',
        content: 'bg-darkgreen ring-1 ring-white/10 shadow-2xl rounded-xl',
        viewport: 'p-1',
        item: 'text-white data-highlighted:not-data-disabled:text-white data-highlighted:not-data-disabled:before:bg-white/5 transition-colors before:rounded-md cursor-pointer',
        itemLeadingIcon: 'text-lightgray group-data-highlighted:not-group-data-disabled:text-white transition-colors',
        input: 'border-b border-white/10 text-white placeholder-gray-500 bg-transparent py-2',
        empty: 'text-lightgray text-sm py-4 font-mono text-center'
      }
    }
  },
});
