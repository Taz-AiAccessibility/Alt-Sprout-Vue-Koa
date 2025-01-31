<template>
  <!-- !!!!!!!!!!!!!!!!!!!!!!!!! remove divs !!!!!!!!!!!!!!!!!!!!!!!!!!!! -->
  <div class="response-display">
    <h2>{{ responseType }}</h2>

    <!-- Simple Description -->
    <div class="alt-text-section">
      <h3>Simple Description:</h3>
      <p>{{ responseText.simple }}</p>
      <button
        @click="copyToClipboard(responseText.simple, 'simple')"
        @mouseleave="resetTooltip('simple')"
      >
        <span class="tooltip" v-if="tooltip.simple">{{ tooltip.simple }}</span>
        <span v-if="copied.simple">✅</span>
        <span v-else>📋 Copy</span>
      </button>
    </div>

    <!-- Complex Description -->
    <div class="alt-text-section">
      <h3>Complex Description:</h3>
      <p>{{ responseText.complex }}</p>
      <button
        @click="copyToClipboard(responseText.complex, 'complex')"
        @mouseleave="resetTooltip('complex')"
      >
        <span class="tooltip" v-if="tooltip.complex">{{
          tooltip.complex
        }}</span>
        <span v-if="copied.complex">✅</span>
        <span v-else>📋 Copy</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, type PropType } from 'vue';

export default defineComponent({
  name: 'ResponseDisplay',
  props: {
    responseType: {
      type: String,
      required: true,
    },
    responseText: {
      type: Object as PropType<{ simple: string; complex: string }>,
      required: true,
    },
  },
  setup() {
    const copied = ref<{ simple: boolean; complex: boolean }>({
      simple: false,
      complex: false,
    });
    const tooltip = ref<{ simple: string | null; complex: string | null }>({
      simple: null,
      complex: null,
    });

    const copyToClipboard = async (
      text: string,
      type: 'simple' | 'complex'
    ) => {
      try {
        await navigator.clipboard.writeText(text);
        copied.value[type] = true;
        tooltip.value[type] = 'Copied!';

        setTimeout(() => {
          copied.value[type] = false;
          tooltip.value[type] = null;
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
        tooltip.value[type] = 'Failed to copy!';
      }
    };

    const resetTooltip = (type: 'simple' | 'complex') => {
      if (!copied.value[type]) {
        tooltip.value[type] = null;
      }
    };

    return { copyToClipboard, copied, tooltip, resetTooltip };
  },
});
</script>

<style scoped>
.response-display {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 600px;
  margin: 20px auto;
}

h2 {
  color: #007bff;
  font-size: 1.4rem;
  margin-bottom: 10px;
}

.alt-text-section {
  margin-top: 15px;
  position: relative;
}

h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 5px;
}

p {
  font-size: 1rem;
  color: #555;
  line-height: 1.5;
}

/* Copy Button */
button {
  margin-top: 8px;
  padding: 6px 12px;
  font-size: 0.9rem;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
  position: relative;
}

button:hover {
  background-color: #0056b3;
}

/* Tooltip */
.tooltip {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background-color: black;
  color: white;
  padding: 5px 10px;
  font-size: 0.8rem;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0.9;
}
</style>
