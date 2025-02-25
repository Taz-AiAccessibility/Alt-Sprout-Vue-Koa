<template>
  <header id="main-header">
    <img :src="logo" id="logo" alt="" aria-hidden="true" />
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
        <h2>Get Started</h2>
        <p>Start making that alt text dance!</p>
        <nav v-if="!user.name" aria-label="Authentication">
          <button @click="loginWithGoogle">Login with Google</button>
        </nav>
        <section id="info">
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
              Alt text is not just a descriptive add-on—it’s a powerful tool
              that drives accessibility, inclusivity, and SEO success. Alt
              Sprout Dance leverages generative AI to streamline the alt text
              creation process, turning a once tedious task into a lively
              performance that elevates your digital content.
            </p>
          </article>
        </section>
      </section>

      <section v-else key="form">
        <KeepAlive>
          <form v-show="showForm" :key="formKey" @submit.prevent="handleSubmit">
            <fieldset>
              <legend>Input Image Information</legend>
              <ImageInput v-model="formData.imageUrl" />
              <SubjectInput v-model="formData.subjects" />
              <TargetAudienceInput v-model="formData.targetAudience" />
              <div class="submit-container">
                <button type="submit" :disabled="isLoading">Submit</button>
                <span v-if="isLoading" class="loader"></span>
              </div>
            </fieldset>
          </form>
        </KeepAlive>

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
import { ref, reactive, nextTick, onMounted } from 'vue';
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
import logo from './assets/alt_sprout_dance_icon.png';
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
      // console.log('🔍 Checking OAuth Redirect...');
      await handleOAuthRedirect(user);

      // console.log('🔍 Checking Supabase Session...');
      await checkSupabaseSession(user);
    });

    // Function to handle form submission for generating alt text
    const handleSubmit = async () => {
      // Indicate that the submission process is starting
      isLoading.value = true;

      // Wait for the next DOM update cycle before proceeding
      await nextTick();

      // Clear any previous error messages
      errorMessage.value = null;

      try {
        // Refresh the user session to ensure valid authentication
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        // If there's an error fetching the session or the access token is missing, throw an error
        if (sessionError || !sessionData?.session?.access_token) {
          throw new Error('User session not found or expired');
        }

        // Make a POST request to the backend alt-text API endpoint
        const response = await fetch(`${BACKEND_URL}/alt-text`, {
          method: 'POST',
          headers: {
            // Specify JSON content in the request
            'Content-Type': 'application/json',
            // Include the user's access token for authentication
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          // Send the necessary data in the request body as JSON
          body: JSON.stringify({
            userUrl: formData.imageUrl, // The URL of the image to generate alt text for
            imageContext: formData.subjects, // Context or description of the image's subjects
            textContext: formData.targetAudience, // Intended target audience for the alt text
          }),
        });

        // If the API response is not OK, extract the error text and throw an error
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.statusText} - ${errorText}`);
        }

        // Parse the successful response JSON data
        const data = await response.json();
        // Save the alt text result to be displayed in the UI
        altTextResult.value = data;
        // Hide the form after a successful alt text generation
        showForm.value = false;
      } catch (error: unknown) {
        // Narrow the error type and extract a message if possible
        if (error instanceof Error) {
          errorMessage.value = `Opps, ${
            error.message.split(':', 1)[0]
          }, maybe try again?`;
        } else {
          errorMessage.value = 'Something went wrong';
        }
      } finally {
        // Regardless of success or error, stop the loading indicator
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
      logo,
      BACKEND_URL,
    };
  },
};
</script>

<style>
/*  Base Styles for Mobile */
header#main-header {
  width: 100%;
  padding: 12px 20px;
  background-color: var(--bg-color);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  box-shadow: 0px 4px 2px 0px #00000040;
}

h1 {
  font-size: 1.4rem;
  margin-bottom: 8px;
}

h2 {
  margin-top: 20px;
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
  margin-right: 7px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

#logo {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

main {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Form Container */
form {
  width: 100%;
  margin: 20px auto;
  padding: 1.2rem;
  background: var(--bg-color);
  border-radius: 8px;
}

/* Form Inputs */
input,
select,
textarea {
  width: 100%;
  padding: 10px;
  margin: 8px 0;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}

fieldset {
  width: 100%; /*  Ensures fieldset stays within the form */
  max-width: 100%; /* Prevents it from expanding too far */
  border: 2px solid #c3d9ed;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box; /* Ensures padding doesn't break layout */
  margin: 0 auto; /* Keeps it centered inside the form */
}

.submit-container {
  display: flex;
  align-items: center;
  gap: 10px; /* Space between button & loader */
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

.welcome-message {
  text-align: center;
  padding: 20px;
  margin: 20px auto;
  width: 100%;
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
  background: var(--bg-color);
  text-align: left;
  width: 100%;
  padding: 40px;
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

.welcome-message .highlight {
  background: #ebebff;
  border-left-color: #535bf2;
}

/* Footer styling */
footer {
  background-color: #c3d9ed;
  text-align: center;
  padding: 15px;
  width: 100%;
}

/* Responsive Adjustments */
@media (min-width: 768px) {
  header#main-header {
    flex-direction: row;
    justify-content: space-between;
  }

  .welcome-message {
    width: 80%;
  }

  .welcome-message .info-box {
    width: 50%;
  }

  h1 {
    font-size: 1.6rem;
  }

  #info {
    display: flex;
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
}

/* Responsive Styling */
@media (min-width: 768px) {
}
</style>
