<template>
  <main id="app">
    <h1>Alt Sprout</h1>
    <form @submit.prevent="handleSubmit">
      <fieldset>
        <legend>Input Image Information</legend>
        <!-- Image Input (Supports URL and File Upload) -->
        <ImageInput v-model="formData.imageUrl" />
        <!-- Subject and Context Inputs -->
        <SubjectInput v-model="formData.subjects" />
        <TargetAudienceInput v-model="formData.targetAudience" />
        <button type="submit">Submit</button>
      </fieldset>
    </form>

    <!-- Show loading state -->
    <p v-if="isLoading">Generating alt text...</p>

    <!-- Display error messages -->
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <!-- Display the submitted values -->
    <!-- <DisplayImage
      :imageUrl="imageUrl"
      :subjects="subjects"
      :targetAudience="targetAudience"
    /> -->

    <!-- Display API Response -->
    <ResponseDisplay
      v-if="altTextResult"
      responseType="Alt Text Result"
      :responseText="altTextResult"
    />
  </main>
</template>

<script lang="ts">
import { ref, reactive } from 'vue';
import ImageInput from './components/ImageInput.vue';
import SubjectInput from './components/SubjectInput.vue';
import TargetAudienceInput from './components/TargetAudienceInput.vue';
import DisplayImage from './components/DisplayImage.vue';
import ResponseDisplay from './components/ResponseDisplay.vue';

export default {
  name: 'App',
  components: {
    ImageInput,
    SubjectInput,
    TargetAudienceInput,
    DisplayImage,
    ResponseDisplay,
  },
  setup() {
    // Store the submitted state
    const imageUrl = ref<string>('');
    const subjects = ref<string>('');
    const targetAudience = ref<string>('');
    const isLoading = ref<boolean>(false);
    const errorMessage = ref<string | null>(null);
    const altTextResult = ref<any>(null); // Store API response

    // Temporary form state
    const formData = reactive({
      imageUrl: '',
      subjects: '',
      targetAudience: '',
    });

    // Form submission handler
    const handleSubmit = async () => {
      isLoading.value = true;
      errorMessage.value = null;

      try {
        const response = await fetch('http://localhost:3000/alt-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userUrl: formData.imageUrl,
            imageContext: formData.subjects,
            textContext: formData.targetAudience,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Alt Text Response:', data.simple);
        altTextResult.value = data; // Store response

        // Update state with submitted values
        imageUrl.value = formData.imageUrl;
        subjects.value = formData.subjects;
        targetAudience.value = formData.targetAudience;
      } catch (error: any) {
        console.error('Error submitting form:', error);
        errorMessage.value = error.message || 'Something went wrong';
      } finally {
        isLoading.value = false;
      }
    };

    return {
      imageUrl,
      subjects,
      targetAudience,
      formData,
      handleSubmit,
      isLoading,
      errorMessage,
      altTextResult,
    };
  },
};
</script>

<style>
#app {
  text-align: center;
  padding: 20px;
}

/* FORM STYLING */
form {
  display: flex;
  flex-direction: column; /* Stack elements vertically */
  align-items: center; /* Center everything horizontally */
  gap: 12px; /* Even spacing between fields */
  width: 90%; /* Take up most of the screen on mobile */
  max-width: 400px; /* Keep form compact on larger screens */
  margin: 0 auto; /* Center form in the page */
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background-color: #f9f9f9;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* FIELDSET */
fieldset {
  display: flex;
  flex-direction: column;
  width: 100%; /* Ensure fieldset is full width */
  gap: 12px;
  border: none;
  padding: 10px;
}

/* LABELS */
label {
  font-size: 1rem;
  font-weight: bold;
  text-align: left;
  width: 100%; /* Ensure labels align properly */
}

/* INPUTS, SELECT, TEXTAREA */
input,
select,
textarea {
  width: 100%; /* Full width input fields */
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  box-sizing: border-box; /* Prevent width issues */
}

/* Improve focus outline */
input:focus,
select:focus,
textarea:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
}

/* BUTTON STYLING */
button {
  width: 100%; /* Full width for better tap interaction */
  max-width: 200px; /* Prevent button from being too wide */
  padding: 12px 16px;
  background-color: #007bff;
  color: white;
  font-size: 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 12px;
  transition: background 0.3s ease-in-out;
}

/* Button hover effect */
button:hover {
  background-color: #0056b3;
}

/* Button disabled state */
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* 🌟 MEDIA QUERY: Responsive Adjustments */
@media (min-width: 768px) {
  form {
    flex-direction: column; /* Keep stacked layout */
    width: 50%; /* Slightly limit form width */
  }

  fieldset {
    flex: 1; /* Make inputs expand evenly */
  }

  button {
    width: auto; /* Prevent button from stretching */
  }
}
</style>
