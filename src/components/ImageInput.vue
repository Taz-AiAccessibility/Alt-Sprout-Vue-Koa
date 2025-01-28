<template>
  <div class="image-input">
    <label for="imageUrl">Image URL:</label>
    <input
      id="imageUrl"
      type="text"
      v-model="localImageUrl"
      @input="updateImageUrl"
      placeholder="Enter image URL"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
  name: 'ImageInput',
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const localImageUrl = ref(props.modelValue);

    // Watch for input changes and emit updates
    watch(localImageUrl, (newValue) => {
      emit('update:modelValue', newValue);
    });

    const updateImageUrl = () => {
      emit('update:modelValue', localImageUrl.value);
    };

    return {
      localImageUrl,
      updateImageUrl,
    };
  },
});
</script>

<style>
.image-input {
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
