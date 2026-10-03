<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../../composables/useAuth';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

const { isLoading, login, register } = useAuth();

const isRegisterMode = ref(false);
const email = ref('');
const password = ref('');
const name = ref('');
const tier = ref('free');
const error = ref<string | null>(null);

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  error.value = null;
};

const handleSubmit = async () => {
  error.value = null;
  try {
    if (isRegisterMode.value) {
      await register(email.value, password.value, name.value, tier.value);
    } else {
      await login(email.value, password.value);
    }
    emit('close');
  } catch (err: any) {
    error.value = err.message || 'Authentication failed';
  }
};
</script>

<template>
  <BaseModal :is-open="props.isOpen" :title="isRegisterMode ? 'Create Account' : 'Sign In'" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div v-if="error" class="p-3 text-sm text-rose-300 bg-rose-950/80 border border-rose-800/80 rounded-xl">
        {{ error }}
      </div>

      <div v-if="isRegisterMode">
        <label class="block mb-1.5 text-xs font-medium text-slate-300">Full Name</label>
        <input
          v-model="name"
          type="text"
          required
          placeholder="John Doe"
          class="w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
        >
      </div>

      <div>
        <label class="block mb-1.5 text-xs font-medium text-slate-300">Email Address</label>
        <input
          v-model="email"
          type="email"
          required
          placeholder="user@example.com"
          class="w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
        >
      </div>

      <div>
        <label class="block mb-1.5 text-xs font-medium text-slate-300">Password</label>
        <input
          v-model="password"
          type="password"
          required
          minlength="6"
          placeholder="••••••••"
          class="w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
        >
      </div>

      <div v-if="isRegisterMode">
        <label class="block mb-1.5 text-xs font-medium text-slate-300">Quota Tier</label>
        <select
          v-model="tier"
          class="w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
        >
          <option value="free">Free (100 req/day)</option>
          <option value="pro">Pro (5,000 req/day)</option>
          <option value="enterprise">Enterprise (50,000 req/day)</option>
        </select>
      </div>

      <div class="pt-2">
        <BaseButton type="submit" :is-loading="isLoading" custom-class="w-full py-3">
          {{ isRegisterMode ? 'Register' : 'Sign In' }}
        </BaseButton>
      </div>

      <div class="text-center pt-2">
        <button
          type="button"
          class="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
          @click="toggleMode"
        >
          {{ isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Register" }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
