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
        <nav>
          <button @click="logout">Logout</button>
        </nav>
      </section>
    </article>
  </header>
  <main id="main-container">
    <transition name="fade" mode="out-in">
      <section v-if="!user.name" key="welcome" class="welcome-message">
        <h2>Welcome to Alt Sprout Dance!</h2>
        <p class="intro">
          Alt Sprout Dance is an AI-powered alt text generator designed to
          create meaningful and accessible image descriptions. Developed in
          collaboration with
          <a href="https://www.smuinballet.org/">Smuin Contemporary Ballet</a>,
          it enhances the quality and efficiency of content creation for
          visually rich platforms.
        </p>
        <article class="info-box">
          <h3>How It Works</h3>
          <ul>
            <li><strong>1.</strong> Log in with your Google account</li>
            <li><strong>2.</strong> Upload a dance image</li>
            <li>
              <strong>3.</strong> Provide subject details & target audience
            </li>
            <li><strong>4.</strong> Submit to generate alt text</li>
          </ul>
        </article>
        <article class="info-box">
          <h3>Why It Matters</h3>
          <p>
            High-quality alt text ensures accessibility, inclusivity, and better
            engagement across digital spaces. By leveraging AI, Alt Sprout Dance
            streamlines the alt text creation process, making it faster and more
            effective.
          </p>
        </article>
        <article class="info-box highlight">
          <h3>Enhance the Model</h3>
          <p>
            Click the ✅ checkmark next to a response you find particularly
            helpful. Your selections contribute to refining and improving future
            alt text generation.
          </p>
        </article>
      </section>

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
      <span class="icon-text">Checkout Alt Sprout on GitHub</span>
      <img id="gitHubIcon" :src="gitHubIcon" alt="GitHub Icon" />
    </a>
    <a :href="`${BACKEND_URL}/terms-of-service`">Terms of Service</a> |
    <a :href="`${BACKEND_URL}/privacy-policy`">Privacy Policy</a>
  </footer>
</template>

<script lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  loginWithGoogle,
  logoutUser,
  checkSupabaseSession,
  handleOAuthRedirect,
} from './auth';
import ImageInput from './components/ImageInput.vue';
import SubjectInput from './components/SubjectInput.vue';
import TargetAudienceInput from './components/TargetAudienceInput.vue';
import ResponseDisplay from './components/ResponseDisplay.vue';
import gitHubIcon from './assets/github-icon.svg';
import { supabase } from './utils/supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default {
  name: 'App',
  components: {
    ImageInput,
    SubjectInput,
    TargetAudienceInput,
    ResponseDisplay,
  },
  setup() {
    const user = ref<{ name?: string; avatar_url?: string; id?: string }>({});
    const isLoading = ref(false);
    const errorMessage = ref<string | null>(null);
    const altTextResult = ref(null);
    const showForm = ref(true);
    const formKey = ref(0);

    const formData = reactive({
      imageUrl: '',
      subjects: '',
      targetAudience: '',
    });

    onMounted(async () => {
      await handleOAuthRedirect(); // ✅ Handles OAuth redirect
      await checkSupabaseSession(user);
    });

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
            Authorization: `Bearer ${sessionData.session.access_token}`, // ✅ Correct Authorization header
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

    const toggleForm = () => {
      showForm.value = !showForm.value;
    };

    const resetForm = () => {
      Object.assign(formData, {
        imageUrl: '',
        subjects: '',
        targetAudience: '',
      });
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
      logout: logoutUser,
      toggleForm,
      resetForm,
      showForm,
      formKey,
      gitHubIcon,
      BACKEND_URL,
    };
  },
};
</script>

<style>
/* 🔹 Base Styles for Mobile */
header#main-header {
  width: 100%;
  padding: 12px 20px;
  background-color: #c3d9ed;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

h1 {
  font-size: 1.4rem;
  margin-bottom: 8px;
}

#auth-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: right;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.welcome-message {
  text-align: center;
  max-width: 90%;
  padding: 20px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  margin: 20px auto;
}

main {
  width: 100%;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Form Styling */
form {
  width: 100%;
  max-width: 500px;
  margin: auto;
}

fieldset {
  width: 100%; /* ✅ Ensures fieldset stays within the form */
  max-width: 100%; /* ✅ Prevents it from expanding too far */
  border: 1px solid #c3d9ed;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box; /* ✅ Ensures padding doesn't break layout */
  margin: 0 auto; /* ✅ Keeps it centered inside the form */
}

/* Buttons */
.button-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

button {
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 1rem;
  width: 100%;
  max-width: 200px;
}

/* Footer */
footer {
  width: 100%;
  background-color: #c3d9ed;
  text-align: center;
  padding: 15px 0;
}

#gitHubAnchor {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

#gitHubIcon {
  width: 30px;
  height: 30px;
}

/* 🔹 Responsive Adjustments */
@media (min-width: 768px) {
  header#main-header {
    flex-direction: row;
    justify-content: space-between;
  }

  h1 {
    font-size: 1.6rem;
  }

  form {
    width: 80%;
  }

  .button-container {
    flex-direction: row;
  }
}

@media (min-width: 1024px) {
  h1 {
    font-size: 1.8rem;
  }

  .welcome-message {
    max-width: 600px;
  }

  form {
    width: 60%;
  }
}

.welcome-message {
  text-align: center;
  max-width: 90%;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  margin: 20px auto;
}

.welcome-message h2 {
  font-size: 1.8rem;
  color: #222;
  margin-bottom: 12px;
}

.welcome-message .intro {
  font-size: 1rem;
  color: #444;
  line-height: 1.6;
  margin-bottom: 20px;
}

.welcome-message .info-box {
  background: #f5f5ff;
  border-left: 5px solid #646cff;
  padding: 12px 16px;
  margin: 15px 0;
  border-radius: 8px;
  text-align: left;
}

.welcome-message .info-box h3 {
  font-size: 1.2rem;
  margin-bottom: 8px;
  color: #333;
}

.welcome-message .info-box ul {
  list-style: none;
  padding: 0;
}

.welcome-message .info-box ul li {
  font-size: 1rem;
  color: #555;
  padding: 5px 0;
}

.welcome-message .info-box strong {
  color: #646cff;
}

.welcome-message .highlight {
  background: #ebebff;
  border-left-color: #535bf2;
}

/* 🔹 Responsive Styling */
@media (min-width: 768px) {
  .welcome-message {
    max-width: 600px;
  }
}
</style>
