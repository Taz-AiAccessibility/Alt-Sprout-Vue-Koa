<template>
  <div class="subject-input">
    <label for="subjects">Subjects:</label>
    <input
      id="subjects"
      type="text"
      v-model="localSubjects"
      @input="updateSubjects"
      placeholder="Enter subjects, comma-separated"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
  name: 'SubjectInput',
  props: {
    modelValue: {
      type: Array as () => string[],
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const localSubjects = ref(props.modelValue.join(', '));

    watch(localSubjects, (newValue) => {
      const subjectsArray = newValue.split(',').map((s) => s.trim());
      emit('update:modelValue', subjectsArray);
    });

    const updateSubjects = () => {
      const subjectsArray = localSubjects.value.split(',').map((s) => s.trim());
      emit('update:modelValue', subjectsArray);
    };

    return {
      localSubjects,
      updateSubjects,
    };
  },
});
</script>

<style>
.subject-input {
  margin-bottom: 20px;
}
label {
  margin-right: 10px;
}
input {
  padding: 5px;
  width: 300px;
}
</style>
