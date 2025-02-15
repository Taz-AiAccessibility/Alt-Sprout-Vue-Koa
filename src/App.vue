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
    <!-- Transition between welcome message and form -->
    <transition name="fade" mode="out-in">
      <section v-if="!user.name" key="welcome" class="welcome-message">
        <h2>Welcome to Alt Sprout Dance!</h2>
        <p>An OpenAI generative tool that makes alt text dance!</p>
        <h3>How It Works:</h3>
        <ul>
          <li>Login with your Google account.</li>
          <li>Upload a dance image.</li>
          <li>Input subjects in the image and select a target audience.</li>
          <li>Submit to generate alt text.</li>
        </ul>
        <h3>Output:</h3>
        <p>
          A simple and a more intricate response to copy and use as alt text for
          the image.
        </p>
        <p>
          Click the checkmark ✅ next to a response if you especially like it!
          This will help improve the model through better fine-tuning.
        </p>
        <p>
          <strong
            >This product is currently being used by Smuin Contemporary
            Ballet.</strong
          >
        </p>
      </section>

      <!-- Main application logic, shown after login -->
      <section v-else key="form">
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
    </transition>
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
import { ref, reactive, onMounted } from 'vue';
import ImageInput from './components/ImageInput.vue';
import SubjectInput from './components/SubjectInput.vue';
import TargetAudienceInput from './components/TargetAudienceInput.vue';
import ResponseDisplay from './components/ResponseDisplay.vue';
import gitHubIcon from './assets/github-icon.svg';
import { supabase } from './utils/supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

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
    const showForm = ref<boolean>(true); // Toggle form visibility
    const formKey = ref(0); // :key updates on resetFrom to override KeepAlive to force a re-render

    const formData = reactive({
      imageUrl: '',
      subjects: '',
      targetAudience: '',
      description_origin: '',
      previewImage: '',
    });

    const setUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return;
      }

      if (data.user) {
        user.value = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || 'Anonymous',
          avatar_url: data.user.user_metadata?.avatar_url || '',
        };
      }
    };

    // Run only ONCE
    onMounted(async () => {
      supabase.auth.onAuthStateChange(async (_, session) => {
        if (session) {
          setUser();
        } else {
          user.value = {};
        }
      });

      // Directly check session from Supabase
      await setUser();
    });

    const loginWithGoogle = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: FRONTEND_URL,
        },
      });

      if (error) {
        console.error('OAuth Error:', error.message);
      }
    };

    const logout = async () => {
      try {
        await supabase.auth.signOut();
        user.value = {};
      } catch (error) {
        console.error('❌ Logout failed:', error);
      }
    };

    // Secure API Request Handling
    const handleSubmit = async () => {
      isLoading.value = true;
      errorMessage.value = null;

      try {
        // Ensure session is refreshed before making request
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError || !sessionData?.session?.access_token) {
          throw new Error('User session not found or expired');
        }

        const response = await fetch(`${BACKEND_URL}/alt-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            userUrl: formData.imageUrl,
            imageContext: formData.subjects,
            textContext: formData.targetAudience,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        altTextResult.value = data;
        showForm.value = false;
      } catch (error: any) {
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

/* Welcome message styles */
.welcome-message {
  text-align: center;
  max-width: 600px;
  margin: 30px auto;
  padding: 20px;
  border-radius: 10px;
  /* ! causing line shadow */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  animation: fadeIn 1s ease-in-out;
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
