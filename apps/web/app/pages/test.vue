<script setup lang="ts">
const authStore = useAuthStore();
</script>

<template>
  <main>
    <h1>Hello</h1>
    <UButton label="Se connecter" @click="authStore.login()" />
  </main>
</template>
