<template>
  <section class="image-input">
    <!-- File Upload -->
    <div class="input" v-if="!useUrl">
      <label for="image-upload">
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          @change="handleFileUpload"
          class="custom-file-input"
        />
      </label>
    </div>

    <!-- Image URL Input -->
    <div class="input" v-if="useUrl">
      <label for="image-url">Image URL:</label>
      <input
        id="image-url"
        type="text"
        v-model="imageUrl"
        placeholder="Paste an image URL"
        @input="emitImageUrl"
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
    <span v-if="uploading" class="loader"></span>
    <article v-if="previewImage && !uploading" class="preview-container">
      <img :src="previewImage" alt="Uploaded Preview" class="preview-image" />
    </article>

    <!-- <p v-if="uploading">Uploading...</p> -->
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, watch, type PropType, onMounted } from 'vue';
import { supabase } from '../utils/supabase';

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
    const useUrl = ref<boolean>(false);
    const uploading = ref<boolean>(false);
    const userId = ref<string | null>(null);

    // Fetch user session securely
    onMounted(async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('❌ Error fetching user:', error);
        } else {
          userId.value = data.user?.id ?? null;
        }
      } catch (err) {
        console.error('🔥 Unexpected Error Fetching User:', err);
      }
    });

    // Emit image URL when user inputs manually
    const emitImageUrl = () => {
      previewImage.value = imageUrl.value;
      emit('update:modelValue', imageUrl.value);
    };

    // Resize Image Before Upload
    const resizeImage = async (
      file: File,
      maxWidth = 800,
      maxHeight = 800
    ): Promise<File> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
              if (width > height) {
                height *= maxWidth / width;
                width = maxWidth;
              } else {
                width *= maxHeight / height;
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: file.type }));
              } else {
                reject(new Error('Failed to resize image'));
              }
            }, file.type);
          };
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
    };

    // Upload Image to Supabase Storage
    const uploadImage = async (file: File): Promise<string | null> => {
      try {
        if (!userId.value) {
          console.error('❌ User ID is missing, cannot upload image.');
          return null;
        }

        const filePath = `uploads/${userId.value}/${Date.now()}-${file.name}`;

        // Upload file to Supabase
        const { error } = await supabase.storage
          .from('images')
          .upload(filePath, file, {
            upsert: false,
            cacheControl: '3600',
            metadata: { owner: userId.value }, // Attach user ID as owner
          });

        if (error) {
          console.error('❌ Supabase Upload Error:', error);
          return null;
        }

        // Retrieve public URL properly
        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        const publicUrl = data?.publicUrl ?? null;

        if (!publicUrl) {
          console.error('❌ Failed to get public URL');
          return null;
        }

        return publicUrl;
      } catch (err) {
        console.error('🔥 Unexpected Upload Error:', err);
        return null;
      } finally {
        uploading.value = false;
      }
    };

    // Handle File Upload
    const handleFileUpload = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      uploading.value = true;

      // Create a local preview URL (remains visible)
      previewImage.value = URL.createObjectURL(file);

      // Resize the image before upload
      const resizedFile = await resizeImage(file);

      // Upload the resized image to Supabase
      const uploadedImageUrl = await uploadImage(resizedFile);

      if (uploadedImageUrl) {
        // Store the Supabase URL ONLY for API submission
        imageUrl.value = uploadedImageUrl;

        // Emit the update to parent (`App.vue`)
        emit('update:modelValue', uploadedImageUrl);
      }
    };

    // Ensure Vue Watches External Changes
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
      emitImageUrl,
      handleFileUpload,
      uploading,
    };
  },
});
</script>

<style scoped>
.image-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 20px;
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

input[type='file']::file-selector-button {
  color: var(--text-color-button);
  padding: 0.3em 0.5em;
  border: none;
  border-radius: 0.2em;
  background-color: var(--bg-button);
  transition: 1s;
}

input[type='file']::file-selector-button:hover {
  background-color: var(--bg-button-hover);
}

#toggle-input {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-start;
}

.toggle-label {
  font-size: 0.8rem;
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
  width: 100%; /* Ensures it takes full width */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px; /* Adds space around the image */
}

.preview-image {
  width: 100%; /* Ensures it scales correctly */
  max-width: 350px; /* Prevents it from getting too large */
  height: auto; /*  Maintains aspect ratio */
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  object-fit: contain;
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid #fff;
  border-top: 3px solid #646cff; /* Primary color */
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

/* Spinning animation */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Optional: Add a spinning effect */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Improve layout on larger screens */
@media (min-width: 768px) {
  .preview-image {
    max-width: 500px;
  }
}
</style>
