<template>
  <div class="app">
    <h1>Image Input Form</h1>
    <ImageInput v-model="imageUrl" />
    <SubjectInput v-model="subjects" />
    <TargetAudienceInput v-model="targetAudience" />
    <DisplayImage
      :imageUrl="imageUrl"
      :subjects="subjects"
      :targetAudience="targetAudience"
    />
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import ImageInput from './components/ImageInput.vue';
import SubjectInput from './components/SubjectInput.vue';
import TargetAudienceInput from './components/TargetAudienceInput.vue';
import DisplayImage from './components/DisplayImage.vue';

export default {
  name: 'App',
  components: {
    ImageInput,
    SubjectInput,
    TargetAudienceInput,
    DisplayImage,
  },
  setup() {
    // State management using Composition API
    const imageUrl = ref<string>('');
    const subjects = ref<string[]>([]);
    const targetAudience = ref<string>('');

    return {
      imageUrl,
      subjects,
      targetAudience,
    };
  },
};
</script>

<style>
.app {
  text-align: center;
  padding: 20px;
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
}
</style>
