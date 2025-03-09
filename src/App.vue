<template>
  <header id="main-header">
    <img :src="logo" id="logo" alt="" aria-hidden="true" />
    <h1>Alt Sprout Dance</h1>
    <article id="auth-container">
      <nav v-if="!user.name" aria-label="Authentication">
        <!-- Changed from loginWithGoogle to handleLogin -->
        <button @click="handleLogin">Login with Google</button>
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
          Alt Sprout Dance is an <b>AI-powered</b> alt text generator designed
          to create meaningful and accessible image descriptions. Developed in
          collaboration with
          <a href="https://www.smuinballet.org/">Smuin Contemporary Ballet</a>,
          it enhances the quality and efficiency of content creation for
          visually rich platforms.
        </p>
        <section id="info">
          <article class="info-box">
            <h3>How It Works</h3>
            <ul class="info-content">
              <li><strong>1.</strong> Log in with your Google account</li>
              <li><strong>2.</strong> Upload a dance image</li>
              <li>
                <figure>
                  <img
                    class="demo-image"
                    src="https://afziltusqfvlckjbgkil.supabase.co/storage/v1/object/sign/assets/maggie-carey.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvbWFnZ2llLWNhcmV5LnBuZyIsImlhdCI6MTc0MTQ4Nzk0NywiZXhwIjoxNzczMDIzOTQ3fQ.y_K4L-KICvYd-38LtyynHuVXxlSvn4EJjFJ1bvFDH70"
                    alt="Ballet dancer Maggie Carey strikes a dynamic pose, wearing a deep burgundy costume against a soft purple background, embodying elegance and strength."
                  />
                  <figcaption class="photo-credit">
                    Photo Credit: Maximillian Tortoriello
                  </figcaption>
                </figure>
              </li>
              <li>
                <strong>3.</strong> Provide subject details: "Maggie Carey"
              </li>
              <li>
                <strong>4.</strong> Select target audience: "Ballet Lovers"
              </li>
              <li><strong>5.</strong> Submit to generate eloquent alt text!</li>
            </ul>
            <h3>Output</h3>

            <p class="info-content">
              <b>Simple Description:</b> "Ballet dancer Maggie Carey strikes a
              dynamic pose, wearing a deep burgundy costume against a soft
              purple background, embodying elegance and strength."
            </p>
            <p class="info-content">
              <b>Complex Description:</b> "In this captivating image, Maggie
              Carey, a professional ballet dancer, showcases elegance and
              strength mid-pose against a backdrop of soft, vibrant purples. Her
              arms are extended gracefully overhead, framing her focused face
              that radiates determination. The delicate layers of her flowing
              costume swirl around her, emphasizing the fluidity of her
              movements. Gentle lighting casts intricate shadows on the
              backdrop, enhancing her poised silhouette. Maggie's passionate
              expression invites ballet lovers into the enchanting world of
              dance, reflecting the artistry and discipline inherent in ballet."
            </p>
          </article>
          <article class="info-box">
            <h3>Why It Matters</h3>
            <p class="info-content">
              Alt text is not just a descriptive add-on—it’s a powerful tool
              that drives <b>accessibility and SEO success</b>. Alt Sprout Dance
              leverages generative AI to streamline the alt text creation
              process, turning a once tedious task into a lively performance
              that elevates your digital content.
            </p>
            <article>
              <h3>Alt Sprout Dance in action!</h3>
              <video
                class="info-content"
                controls="false"
                width="100%"
                height="auto"
                name="Video Name"
              >
                <source
                  src="https://afziltusqfvlckjbgkil.supabase.co/storage/v1/object/sign/assets/demo-vidoe-trimmed.mov?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvZGVtby12aWRvZS10cmltbWVkLm1vdiIsImlhdCI6MTc0MTQ4NzU3MCwiZXhwIjoxNzczMDIzNTcwfQ.7Slo0NRrdG72WCBwUC2eTpGlS3KsPxGLUA3CDL_tZ0I  "
                />
              </video>
              <h3>Get Started</h3>
              <p>Start making that alt text dance!</p>
              <nav v-if="!user.name" aria-label="Authentication">
                <!-- Changed from loginWithGoogle to handleLogin -->
                <button @click="handleLogin">Login with Google</button>
              </nav>
            </article>
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

  <!-- Overlay for LinkedIn in-app browser -->
  <div v-if="showBrowserOverlay" class="overlay">
    <div class="overlay-content">
      <h2>
        Please Open in Your Browser via
        <span class="menu-dots">
          "<span></span>
          <span></span>
          <span></span>"
        </span>
      </h2>
      <p>👋 Hi there, thank you for checking out Alt Sprout Dance!</p>
      <p>
        It looks like you're viewing this site in the LinkedIn mobile app. For a
        better experience and to securely log in, please open this page in your
        device’s browser. Tap the three dots in the top right and select "Open
        in Browser". Cheers!
      </p>
      <button @click="closeOverlay">Cancel</button>
    </div>
  </div>
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

    // Overlay and LinkedIn detection state
    const showBrowserOverlay = ref(false);
    const isLinkedInApp = ref(false);

    onMounted(async () => {
      if (typeof window !== 'undefined' && window.navigator) {
        const ua = window.navigator.userAgent || '';
        // Check for LinkedIn mobile app user agent
        if (ua.includes('LinkedIn')) {
          isLinkedInApp.value = true;
        }
      }
      await handleOAuthRedirect(user);
      await checkSupabaseSession(user);
    });

    // Modified login function that shows overlay if in LinkedIn mobile app
    const handleLogin = () => {
      if (isLinkedInApp.value) {
        showBrowserOverlay.value = true;
      } else {
        loginWithGoogle();
      }
    };

    const closeOverlay = () => {
      showBrowserOverlay.value = false;
    };

    const handleSubmit = async () => {
      isLoading.value = true;
      await nextTick();
      errorMessage.value = null;
      try {
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
      } catch (error: unknown) {
        if (error instanceof Error) {
          errorMessage.value = `Oops, ${
            error.message.split(':', 1)[0]
          }, maybe try again?`;
        } else {
          errorMessage.value = 'Something went wrong';
        }
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
      handleLogin,
      logout: logoutUser,
      toggleForm,
      resetForm,
      showForm,
      formKey,
      gitHubIcon,
      logo,
      BACKEND_URL,
      showBrowserOverlay,
      closeOverlay,
    };
  },
};
</script>

<style>
/* Base Styles for Mobile */
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
  width: 100%;
  max-width: 100%;
  border: 2px solid #c3d9ed;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
  margin: 0 auto;
}

.submit-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid #fff;
  border-top: 3px solid #646cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

.demo-image {
  max-height: 300px;
}

.demo-video {
  max-height: 300px;
}

.info-content {
  margin: 20px 0;
}

.photo-credit {
  color: gray;
  font-size: small;
}

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

/* Overlay Styles */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-content {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  max-width: 90%;
}

.overlay-content h2 {
  margin-bottom: 1rem;
}

.overlay-content p {
  margin-bottom: 1.5rem;
}

.overlay-content button {
  margin: 0 0.5rem;
  padding: 0.5rem 1rem;
}

.menu-dots {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px; /* Adjust spacing between dots as needed */
  cursor: pointer;
  margin-left: 5px;
}

.menu-dots span {
  display: block;
  width: 6px; /* Adjust size as needed */
  height: 6px;
  background-color: #888; /* Use a color that matches LinkedIn's style */
  border-radius: 50%;
}
</style>
