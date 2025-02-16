<template>
  <div class="response-display">
    <h2>{{ responseType }}</h2>

    <!-- Simple Description -->
    <div class="alt-text-section">
      <h3>Simple Description:</h3>
      <p>{{ responseText.simple }}</p>
      <div class="actions">
        <button
          @click="copyToClipboard(responseText.simple, 'simple')"
          @mouseleave="resetTooltip('simple')"
        >
          <span class="tooltip" v-if="tooltip.simple">{{
            tooltip.simple
          }}</span>
          <span v-if="copied.simple">✅</span>
          <span v-else>📋 Copy</span>
        </button>
        <!-- !!!!!! add :disabled=liked.simple -->
        <span
          class="heart-icon"
          :class="{ liked: liked.simple, completed: liked.simple }"
          @click="!liked.simple && toggleLike('simple')"
        >
          <span v-if="!liked.simple">✅</span>
          <span v-else>❤️</span>
        </span>
      </div>
    </div>

    <!-- Complex Description -->
    <div class="alt-text-section">
      <h3>Complex Description:</h3>
      <p>{{ responseText.complex }}</p>
      <div class="actions">
        <button
          @click="copyToClipboard(responseText.complex, 'complex')"
          @mouseleave="resetTooltip('complex')"
        >
          <span class="tooltip" v-if="tooltip.complex">{{
            tooltip.complex
          }}</span>
          <span v-if="copied.complex">✅</span>
          <span v-else>📋 Copy</span>
        </button>
        <span
          class="heart-icon"
          :class="{ liked: liked.complex, completed: liked.complex }"
          @click="!liked.complex && toggleLike('complex')"
        >
          <span v-if="!liked.complex">✅</span>
          <span v-else>❤️</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, type PropType } from 'vue';
import { supabase } from '../utils/supabase';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default defineComponent({
  name: 'ResponseDisplay',
  props: {
    responseType: {
      type: String,
      required: true,
    },
    responseText: {
      type: Object as PropType<{
        simple: string;
        complex: string;
        description_origin: string;
        subjects: string;
        targetAudience: string;
      }>,
      required: true,
    },
    userId: {
      type: String,
      required: true, // Ensure user ID is passed from parent
    },
  },
  setup(props) {
    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const copied = ref<{ simple: boolean; complex: boolean }>({
      simple: false,
      complex: false,
    });
    const tooltip = ref<{ simple: string | null; complex: string | null }>({
      simple: null,
      complex: null,
    });

    const liked = ref<{ simple: boolean; complex: boolean }>({
      simple: false,
      complex: false,
    });

    const copyToClipboard = async (
      text: string,
      type: 'simple' | 'complex'
    ) => {
      try {
        await navigator.clipboard.writeText(text);
        copied.value[type] = true;
        tooltip.value[type] = 'Copied!';

        setTimeout(() => {
          copied.value[type] = false;
          tooltip.value[type] = null;
        }, 2000);
      } catch (error) {
        tooltip.value[type] = 'Failed to copy!';
      }
    };

    const resetTooltip = (type: 'simple' | 'complex') => {
      if (!copied.value[type]) {
        tooltip.value[type] = null;
      }
    };

    const toggleLike = async (type: 'simple' | 'complex') => {
      if (!props.userId) {
        return;
      }

      try {
        // Fetch session token
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError || !sessionData?.session?.access_token) {
          throw new Error('User session not found or expired');
        }

        const payload = {
          descriptionType: type,
          descriptionText: props.responseText[type],
          descriptionOrigin: props.responseText.description_origin,
          subjects: props.responseText.subjects,
          targetAudience: props.responseText.targetAudience,
          userId: props.userId,
        };

        const response = await fetch(`${BACKEND_URL}/like-description`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${errorText}`);
        }

        liked.value[type] = true;
      } catch (error) {
        throw error;
      }
    };

    return {
      copyToClipboard,
      copied,
      tooltip,
      resetTooltip,
      liked,
      toggleLike,
    };
  },
});
</script>

<style scoped>
.response-display {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  text-align: center;
  max-width: 600px;
  margin: 20px auto;
}

/* Headings */
h2 {
  color: #007bff;
  font-size: 1.3rem;
  margin-bottom: 10px;
}

h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 5px;
}

p {
  font-size: 1rem;
  color: #555;
  line-height: 1.5;
}

/* Copy Button */
button {
  padding: 8px 12px;
  font-size: 1rem;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

/* Tooltip */
.tooltip {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background-color: black;
  color: white;
  padding: 5px 10px;
  font-size: 0.8rem;
  border-radius: 4px;
  opacity: 0.9;
}

/* Heart Icon */
.heart-icon {
  cursor: pointer;
  font-size: 1.5rem;
  margin-left: 10px;
  transition: color 0.3s;
}

.heart-icon.liked {
  color: red;
}

/* Actions Container */
.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}
</style>
