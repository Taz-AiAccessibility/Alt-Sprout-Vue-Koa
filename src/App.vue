<template>
  <main id="app">
    <h1>Alt Sprout</h1>

    <!-- 🔹 Google Login Button -->
    <div class="auth-section">
      <button v-if="!user" @click="loginWithGoogle">Login with Google</button>
      <div v-else>
        <p>Welcome, {{ user.name }}!</p>
        <img :src="user.avatar_url" alt="User Avatar" class="avatar" />
        <button @click="logout">Logout</button>
      </div>
    </div>

    <form @submit.prevent="handleSubmit">
      <fieldset>
        <legend>Input Image Information</legend>
        <ImageInput v-model="formData.imageUrl" />
        <SubjectInput v-model="formData.subjects" />
        <TargetAudienceInput v-model="formData.targetAudience" />
        <button type="submit">Submit</button>
      </fieldset>
    </form>

    <p v-if="isLoading">Generating alt text...</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <ResponseDisplay
      v-if="altTextResult"
      responseType="Alt Text Result"
      :responseText="altTextResult"
    />
  </main>
</template>

<script lang="ts">
import { ref, reactive, onMounted } from 'vue';
import ImageInput from './components/ImageInput.vue';
import SubjectInput from './components/SubjectInput.vue';
import TargetAudienceInput from './components/TargetAudienceInput.vue';
import ResponseDisplay from './components/ResponseDisplay.vue';

export default {
  name: 'App',
  components: {
    ImageInput,
    SubjectInput,
    TargetAudienceInput,
    ResponseDisplay,
  },
  setup() {
    const user = ref<any>(null);
    const isLoading = ref<boolean>(false);
    const errorMessage = ref<string | null>(null);
    const altTextResult = ref<any>(null);

    const formData = reactive({
      imageUrl: '',
      subjects: '',
      targetAudience: '',
    });

    // 🔹 Fetch user session when the app loads
    const fetchUserSession = async () => {
      try {
        const response = await fetch('http://localhost:3000/user-session', {
          credentials: 'include', // Ensure cookies are sent with the request
        });
        const data = await response.json();
        if (data.user) user.value = data.user;
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };

    onMounted(fetchUserSession);

    // 🔹 Redirect to Google OAuth Login

    const loginWithGoogle = () => {
      window.location.href = 'http://localhost:3000/auth/google';
    };

    // 🔹 Logout Function
    const logout = async () => {
      try {
        await fetch('http://localhost:3000/logout', {
          method: 'GET',
          credentials: 'include', // Ensure session cookies are removed
        });
        user.value = null;
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };

    // 🔹 Form submission handler
    const handleSubmit = async () => {
      isLoading.value = true;
      errorMessage.value = null;

      try {
        const response = await fetch('http://localhost:3000/alt-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userUrl: formData.imageUrl,
            imageContext: formData.subjects,
            textContext: formData.targetAudience,
          }),
        });

        if (!response.ok) throw new Error(`API error: ${response.statusText}`);

        const data = await response.json();
        altTextResult.value = data;
      } catch (error: any) {
        console.error('Error submitting form:', error);
        errorMessage.value = error.message || 'Something went wrong';
      } finally {
        isLoading.value = false;
      }
    };

    return {
      user,
      formData,
      handleSubmit,
      isLoading,
      errorMessage,
      altTextResult,
      loginWithGoogle,
      logout,
    };
  },
};
</script>

<style>
#app {
  text-align: center;
  padding: 20px;
}

.auth-section {
  margin-bottom: 20px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-top: 10px;
}
</style>
