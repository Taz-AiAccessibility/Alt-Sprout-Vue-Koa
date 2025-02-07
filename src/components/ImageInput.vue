<template>
  <section class="image-input">
    <!-- File Upload Input (Shown when useUrl is false) -->
    <div class="input" v-if="!useUrl">
      <label for="image-upload">Upload a Image:</label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        @change="handleFileUpload"
      />
    </div>

    <!-- Image URL Input (Shown when useUrl is true) -->
    <div class="input" v-if="useUrl">
      <label for="image-url">Image URL:</label>
      <input
        id="image-url"
        type="text"
        v-model="imageUrl"
        placeholder="Paste an image URL"
        @input="emitImage"
      />
    </div>

    <!-- Toggle Between File Upload & URL -->
    <article id="toggle-input">
      <label class="toggle-label">
        <input type="checkbox" v-model="useUrl" />
        Use Image URL instead of File Upload
      </label>
    </article>

    <!-- Preview Image -->
    <article v-if="previewImage" class="preview-container">
      <img :src="previewImage" alt="Uploaded Preview" class="preview-image" />
    </article>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, watch, type PropType } from 'vue';

export default defineComponent({
  name: 'ImageInput',
  props: {
    modelValue: {
      type: String as PropType<string>,
      required: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const imageUrl = ref<string>(props.modelValue || '');
    const previewImage = ref<string | null>(null);
    const useUrl = ref<boolean>(false); // Toggle between URL and file upload

    // Emit changes when URL input is used
    const emitImage = () => {
      previewImage.value = imageUrl.value; // Show preview for URLs
      emit('update:modelValue', imageUrl.value);
    };

    // Handle File Upload
    const handleFileUpload = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];

      if (file) {
        // Convert file to Blob URL for preview
        const fileUrl = URL.createObjectURL(file);
        previewImage.value = fileUrl;
        imageUrl.value = fileUrl; // Store URL for later use
        emit('update:modelValue', fileUrl);

        // Optional: Convert file to Base64 for API submission
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          emit('update:modelValue', base64String); // Pass Base64 to parent
        };
        reader.readAsDataURL(file);
      }
    };

    // Watch for external model changes (e.g., reset form)
    watch(
      () => props.modelValue,
      (newValue) => {
        imageUrl.value = newValue || '';
        previewImage.value = newValue || null;
      }
    );

    return {
      imageUrl,
      previewImage,
      useUrl,
      emitImage,
      handleFileUpload,
    };
  },
});
</script>

<style scoped>
.image-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 20px 0 20px;
  align-items: center;
}

input[type='text'],
input[type='file'] {
  width: 80%;
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}

#toggle-input {
  display: flex;
  align-items: center;
  gap: 6px; /* Adjust spacing between elements */
  justify-content: flex-start;
}

.toggle-label {
  font-size: 0.8rem; /* Make text slightly smaller */
  line-height: none;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.toggle-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.preview-container {
  margin-top: 10px;
}

.preview-image {
  max-width: 80%;
  height: auto;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
