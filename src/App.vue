<!-- Define it Globally (config.ts)
Instead of repeating this in multiple components, you can create a config.ts file:


export const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';
Then, import it where needed:


import { FRONTEND_URL } from '@/config';

console.log(FRONTEND_URL); // Check if it's correctly loaded -->

<template>
  <header id="main-header">
    <h1>Alt Sprout Dance</h1>
    <article id="auth-container">
      <nav v-if="!user.name" aria-label="Authentication">
        <button @click="loginWithGoogle">Login with Google</button>
      </nav>
      <section v-else class="user-info">
        <img v-if="user.avatar_url" :src="user.avatar_url" class="avatar" />
        <!-- :alt="`Profile picture of ${user.name}`" -->

        <nav>
          <button @click="logout">Logout</button>
        </nav>
      </section>
    </article>
  </header>
  <main id="main-container">
    <section v-if="user.name">
      <transition name="fade">
        <!-- :key updates on resetFrom to override KeepAlive to force a re-render -->
        <KeepAlive>
          <form v-show="showForm" :key="formKey" @submit.prevent="handleSubmit">
            <fieldset>
              <legend>Input Image Information</legend>
              <ImageInput v-model="formData.imageUrl" />
              <SubjectInput v-model="formData.subjects" />
              <TargetAudienceInput v-model="formData.targetAudience" />
              <button type="submit">Submit</button>
            </fieldset>
          </form>
        </KeepAlive>
      </transition>

      <transition name="fade">
        <p v-if="!altTextResult && isLoading">Generating alt text...</p>
      </transition>

      <transition name="fade">
        <p v-if="!altTextResult && errorMessage" class="error">
          {{ errorMessage }}
        </p>
      </transition>

      <transition name="fade">
        <ResponseDisplay
          v-if="altTextResult && user.id && !showForm"
          responseType="Alt Text Result"
          :responseText="altTextResult"
          :user-id="user.id || ''"
        />
      </transition>

      <!-- Toggle Button -->
      <div class="button-container">
        <button v-if="!showForm && altTextResult" @click="toggleForm">
          Edit Input
        </button>
        <button v-if="showForm && altTextResult" @click="toggleForm">
          View Results
        </button>
        <button @click="resetForm">Reset</button>
      </div>
    </section>
  </main>
  <footer>
    <a
      id="gitHubAnchor"
      href="https://github.com/Taz-AiAccessibility/Alt-Sprout-Vue-Koa"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Checkout the A11y Sprout on GitHub"
    >
      <span className="icon-text">Checkout Alt Sprout on GitHub</span>
      <img
        aria-hidden="true"
        id="gitHubIcon"
        :src="gitHubIcon"
        alt="GitHub Icon"
      />
    </a>
  </footer>
</template>

<script lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import ImageInput from './components/ImageInput.vue';
import SubjectInput from './components/SubjectInput.vue';
import TargetAudienceInput from './components/TargetAudienceInput.vue';
import ResponseDisplay from './components/ResponseDisplay.vue';
import gitHubIcon from './assets/github-icon.svg';

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
    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    const user = ref<{ name?: string; avatar_url?: string; id?: string }>({});
    const isLoading = ref<boolean>(false);
    const errorMessage = ref<string | null>(null);
    const altTextResult = ref<any>(null);
    const showForm = ref<boolean>(true); // Toggle form visibility
    const formKey = ref(0); // :key updates on resetFrom to override KeepAlive to force a re-render

    const formData = reactive({
      imageUrl: '',
      subjects: '',
      targetAudience: '',
      description_origin: '',
      previewImage: '',
    });

    // watch(
    //   () => formData.imageUrl,
    //   (newUrl, oldUrl) => {
    //     if (newUrl !== oldUrl) {
    //       altTextResult.value = null;
    //     }
    //   }
    // );

    watch(user, (newUser) => {
      console.log('👤 User data updated:', newUser);
    });

    const fetchUserSession = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/user-session`, {
          credentials: 'include', // Ensures cookies are sent with the request
        });

        console.log('RESPONSE:', response);

        const data = await response.json();

        if (data.user) {
          user.value = {
            name: data.user.name,
            avatar_url: data.user.avatar_url,
            id: data.user.id,
          };

          console.log('✅ User session fetched:', user.value);
        } else {
          console.warn('⚠️ No user session found.');
          user.value = {};
        }
      } catch (error) {
        console.error('❌ Error fetching user session:', error);
      }
    };

    onMounted(fetchUserSession);

    // Redirect to Google OAuth Login
    const loginWithGoogle = () => {
      window.location.href = `${BACKEND_URL}/auth/google`;
    };

    const logout = async () => {
      try {
        await fetch(`${BACKEND_URL}/logout`, {
          method: 'GET',
          credentials: 'include', // Ensures cookies are included
        });

        user.value = {}; // Clears user state
        window.location.href = '/'; // Redirect to home page
      } catch (error) {
        console.error('❌ Logout failed:', error);
      }
    };

    // Form submission handler
    const handleSubmit = async () => {
      isLoading.value = true;
      errorMessage.value = null;

      try {
        const response = await fetch(`${BACKEND_URL}/alt-text`, {
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
        showForm.value = false;
      } catch (error: any) {
        console.error('Error submitting form:', error);
        errorMessage.value = error.message || 'Something went wrong';
      } finally {
        isLoading.value = false;
      }
    };

    // Toggle form visibility
    const toggleForm = () => {
      showForm.value = !showForm.value;
    };

    // Reset everything
    const resetForm = () => {
      formData.imageUrl = '';
      formData.subjects = '';
      formData.targetAudience = '';
      formData.previewImage = '';
      altTextResult.value = null;
      showForm.value = true;
      formKey.value++;
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
      toggleForm,
      resetForm,
      showForm,
      formKey,
      gitHubIcon,
    };
  },
};
</script>

<style>
/* header */
header#main-header {
  display: flex;
  justify-content: space-between;
}

h1 {
  font-size: small;
}

header#main-header {
  padding: 0 10px;
  background-color: gray;
}

/* login & user */
header .auth-container {
  width: 100%;
  display: flex;
}

section.user-info {
  display: flex;
  align-items: center;
  justify-content: right;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

/* main */
main {
  flex-grow: 1;
  max-width: 1280px;
  margin: 10px auto;
}

/* transition elements -> input, output, loading, errors */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.button-container {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

button {
  padding: 8px 16px;
  border: none;
  background-color: #3498db;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background-color: #2980b9;
}

/* footer */
footer {
  height: 60px;
  background-color: #1b2730;
  text-align: center;
  line-height: 60px; /* Center text vertically */
}

#gitHubAnchor {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

#gitHubIcon {
  height: 30px;
  width: 30px;
}
</style>
