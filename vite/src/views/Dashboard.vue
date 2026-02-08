<template>
  <div class="p-10">
    <h1 class="text-3xl font-bold">🎉 Dashboard</h1>
    <p class="mt-4">Welcome, {{ user?.username }}</p>
    <button
      @click="logout"
      class="mt-4 px-4 py-2 bg-red-500 text-white rounded"
    >
      Logout
    </button>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const user = auth.user

function logout() {
  auth.logout()
  window.location.href = '/login'
}
</script>
