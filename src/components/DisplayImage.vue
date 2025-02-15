<template>
  <section v-if="imageUrl" class="display-image">
    <img :src="imageUrl" alt="Submitted Image" />
    <p><strong>Subjects:</strong> {{ subjects }}</p>
    <p><strong>Target Audience:</strong> {{ targetAudience }}</p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DisplayImage',
  props: {
    imageUrl: {
      type: String,
      required: true,
    },
    subjects: {
      type: String,
      required: true,
    },
    targetAudience: {
      type: String,
      required: true,
    },
  },
});
</script>

<style>
.display-image {
  margin-top: 20px;
}
img {
  max-width: 300px;
  height: auto;
  border: 1px solid #ddd;
  margin-bottom: 10px;
}
</style>
