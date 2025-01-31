<!-- <template>
  <Fragment>
    <label for="imageUrl">Image URL:</label>
    <input
      id="imageUrl"
      type="text"
      v-model="localImageUrl"
      @input="updateImageUrl"
      placeholder="Enter image URL"
    />
  </Fragment>
</template>

<script lang="ts">
import { defineComponent, Fragment, ref, watch } from 'vue';

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
</style> -->

<template>
  <div class="image-input">
    <label>Enter Image URL or Upload a File:</label>

    <!-- Image URL Input -->
    <input
      type="text"
      v-model="imageUrl"
      placeholder="Paste an image URL"
      @input="emitImage"
    />

    <p>OR</p>

    <!-- File Upload Input -->
    <input type="file" accept="image/*" @change="handleFileUpload" />

    <!-- Preview Image -->
    <div v-if="previewImage" class="preview-container">
      <img :src="previewImage" alt="Uploaded Preview" class="preview-image" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from 'vue';

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
  align-items: center;
}

input[type='text'],
input[type='file'] {
  width: 100%;
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.preview-container {
  margin-top: 10px;
}

.preview-image {
  max-width: 100%;
  height: auto;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
