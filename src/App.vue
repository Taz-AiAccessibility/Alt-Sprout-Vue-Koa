<template>
  <header>
    <h1>Alt Sprout</h1>
  </header>
  <main id="app">
    <article class="auth-container">
      <nav v-if="!user.name" aria-label="Authentication">
        <button @click="loginWithGoogle">Login with Google</button>
      </nav>

      <section v-else class="user-info">
        <header>
          <h2>Welcome, {{ user.name }}!</h2>
        </header>
        <figure>
          <img
            :src="user?.avatar_url"
            :alt="`Profile picture of ${user.name}`"
            class="avatar"
          />
        </figure>
        <nav>
          <button @click="logout">Logout</button>
        </nav>
      </section>
    </article>

    <section v-if="user.name">
      <!-- Form for Image Input, Subject and Audience Context -->
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
      <p v-if="altTextResult && user.id">Debug: Rendering ResponseDisplay</p>
      <ResponseDisplay
        v-if="altTextResult && user.id"
        responseType="Alt Text Result"
        :responseText="altTextResult"
        :user-id="user.id || ''"
      />
    </section>
  </main>
  <footer></footer>
</template>

<script lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
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
    // might need to expand on user properties
    const user = ref<{ name?: string; avatar_url?: string; id?: string }>({});
    const isLoading = ref<boolean>(false);
    const errorMessage = ref<string | null>(null);
    const altTextResult = ref<any>(null);

    const formData = reactive({
      imageUrl: '',
      subjects: '',
      targetAudience: '',
      description_origin: '',
    });

    watch(
      () => formData.imageUrl,
      (newUrl, oldUrl) => {
        if (newUrl !== oldUrl) {
          console.log('🆕 Image changed, resetting altTextResult');
          altTextResult.value = null;
        }
      }
    );

    const fetchUserSession = async () => {
      try {
        const response = await fetch('http://localhost:3000/user-session', {
          credentials: 'include',
        });

        const data = await response.json();

        if (data.user && data.token) {
          user.value = data.user;
          localStorage.setItem('supabase_token', data.token); // ✅ Store token properly
          console.log('✅ Token stored:', data.token);
        } else {
          console.warn('⚠️ No user session found.');
          localStorage.removeItem('supabase_token'); // Ensure it's cleared if invalid
        }

        console.log('✅ User session fetched:', user.value);
      } catch (error) {
        console.error('❌ Error fetching user session:', error);
      }
    };

    onMounted(fetchUserSession);

    // Redirect to Google OAuth Login

    const loginWithGoogle = () => {
      window.location.href = 'http://localhost:3000/auth/google';
    };

    // Logout Function
    const logout = async () => {
      try {
        await fetch('http://localhost:3000/logout', {
          method: 'GET',
          credentials: 'include',
        });
        // Clears user state
        user.value = {};
        // Clear token
        localStorage.removeItem('supabase_token');
        // Redirect to home page
        window.location.href = '/';
      } catch (error) {
        console.error('❌ Logout failed:', error);
      }
    };

    // Form submission handler
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
