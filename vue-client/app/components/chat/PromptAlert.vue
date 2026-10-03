<script setup lang="ts">
const props = defineProps<{
  patterns?: string[];
}>();
</script>

<template>
  <div class="flex items-start gap-2.5 p-3 mb-2 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
    <span class="text-sm">🛡️</span>
    <div>
      <div class="font-semibold text-rose-200">Security Warning: Prompt Injection Pattern Flagged</div>
      <p class="text-[11px] text-rose-400 mt-0.5">
        This message triggered security scanner filters. Input has been sanitized before sending to LLM.
      </p>
      <div v-if="props.patterns && props.patterns.length > 0" class="mt-1 font-mono text-[10px] text-rose-400/80">
        Matched Rules: {{ props.patterns.join(', ') }}
      </div>
    </div>
  </div>
</template>
