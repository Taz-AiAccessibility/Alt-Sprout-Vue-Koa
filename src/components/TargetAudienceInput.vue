<template>
  <div class="target-audience-input">
    <label for="audience">Target Audience:</label>
    <input
      id="audience"
      type="text"
      v-model="localAudience"
      @input="updateAudience"
      placeholder="Enter target audience"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
  name: 'TargetAudienceInput',
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const localAudience = ref(props.modelValue);

    watch(localAudience, (newValue) => {
      emit('update:modelValue', newValue);
    });

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

<style>
.target-audience-input {
  margin-bottom: 20px;
}
label {
  margin-right: 10px;
}
input {
  padding: 5px;
  width: 300px;
}
</style>
