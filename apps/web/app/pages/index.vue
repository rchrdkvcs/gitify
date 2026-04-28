<script setup lang="ts">
const featuresItems = ref([
  {
    title: "Curated Issues",
    description:
      "Hand-picked tasks specifically tagged for beginners. No more digging through complex backlogs.",
    icon: "lucide:bug",
  },
  {
    title: "Mentorship Friendly",
    description:
      "Connect with senior devs willing to guide you through your first meaningful contribution.",
    icon: "lucide:users",
  },
  {
    title: "Portfolio Builder",
    description:
      "Automatically generate a showcase of your merged PRs to impress future employers.",
    icon: "lucide:briefcase",
  },
]);
</script>

<template>
  <UPageHero
    description="The launchpad for junior developers. Find 'Good First Issues', merge your first PR, and level up your career with a community of builders."
    :links="[
      {
        label: 'Start Contributing',
        to: '/explore',
        icon: 'lucide:rocket',
      },
      {
        label: 'Learn More',
        to: '/about',
        color: 'neutral',
        variant: 'subtle',
        icon: 'lucide:book-open',
      },
    ]"
  >
    <template #top>
      <HeroBackground />
    </template>

    <template #title>
      <h1
        class="font-mono text-5xl font-bold tracking-tight text-pretty text-highlighted sm:text-7xl"
      >
        Code, Collab, <span class="text-primary">Conquer</span>
      </h1>
    </template>
  </UPageHero>

  <UContainer class="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
    <UPageCard
      v-for="feature in featuresItems"
      :key="feature.title"
      :title="feature.title"
      :description="feature.description"
      :icon="feature.icon"
      :ui="{
        root: 'border-2 border-muted/50 bg-muted/50',
      }"
    />
  </UContainer>

  <UContainer class="flex flex-col py-8 lg:gap-8 lg:py-16 xl:gap-16 xl:py-20">
    <div class="flex w-full flex-col items-center gap-4">
      <div class="flex w-full flex-col items-start gap-1">
        <h3 class="text-xl font-semibold lg:text-2xl xl:text-4xl">Featured Repositories</h3>
        <p class="text-muted xl:text-lg">Discover projects that need your help right now</p>
      </div>

      <div class="no-scrollbar flex w-full items-start gap-2 overflow-y-scroll">
        <UBadge
          label="Javascript"
          size="lg"
          class="cursor-pointer rounded-full"
          color="neutral"
          variant="subtle"
          v-for="i in 10"
          :key="i"
        />
      </div>
    </div>

    <UPageGrid>
      <UPageCard
        v-for="i in 6"
        :key="i"
        title="Example Repository"
        description="A brief description of the repository goes here."
        icon="lucide:folder"
        :ui="{
          root: 'border-2 border-muted/50 bg-muted/50',
        }"
      />
    </UPageGrid>

    <UButton
      trailing-icon="lucide:arrow-right"
      label="View All Repositories"
      color="neutral"
      variant="ghost"
      to="/explore"
      class="mx-auto w-fit"
      block
    />
  </UContainer>

  <UPageSection
    title="Ready to make your mark?"
    description="Connect your GitHub account today and start building your developer portfolio with real-world contributions."
    :ui="{
      root: 'bg-linear-to-t from-primary/25 to-transparent',
      title: 'font-mono',
    }"
    :links="[
      {
        label: 'Start Contributing',
        to: '/explore',
        icon: 'lucide:rocket',
      },
    ]"
  />
</template>
