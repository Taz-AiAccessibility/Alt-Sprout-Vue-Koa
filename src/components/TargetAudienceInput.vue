<template>
  <div class="target-audience-input">
    <label for="audience">Target Audience:</label>
    <select id="audience" v-model="localAudience" @change="updateAudience">
      <option value="Ballet Lovers">Ballet Lovers</option>
      <option value="Dance Enthusiasts">Dance Enthusiasts</option>
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
  name: 'TargetAudienceInput',
  props: {
    modelValue: {
      type: String,
      required: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const localAudience = ref(props.modelValue || 'Ballet Lovers');

    watch(
      () => props.modelValue,
      (newValue) => {
        if (newValue !== localAudience.value) {
          localAudience.value = newValue || 'Ballet Lovers';
        }
      }
    );

    const updateAudience = () => {
      emit('update:modelValue', localAudience.value);
    };

    return {
      localAudience,
      updateAudience,
    };
  },
});
</script>

<style scoped>
.target-audience-input {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* Ensures label and select align properly */
  width: 100%;
  max-width: 320px;
  gap: 5px;
}

label {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
}

select {
  width: 100%;
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f9f9f9;
  cursor: pointer;
  transition: border 0.2s ease-in-out;
}

select:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 5px rgba(100, 108, 255, 0.5);
}

@media (max-width: 480px) {
  .target-audience-input {
    max-width: 100%;
  }
}
</style>
