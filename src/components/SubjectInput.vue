<template>
  <label for="subjects">Subjects:</label>
  <input
    id="subjects"
    type="text"
    v-model="localSubjects"
    @input="updateSubjects"
    placeholder="Enter subjects, comma-separated"
  />
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
  name: 'SubjectInput',
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const localSubjects = ref(props.modelValue);

    // this may need to change to being just a string instead of an array of subjects
    watch(localSubjects, (newValue) => {
      emit('update:modelValue', newValue);
    });

    const updateSubjects = () => {
      emit('update:modelValue', localSubjects.value);
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
  font-weight: 600;
  font-size: 1rem;

  text-align: left;
}
input {
  background: var(--bg-color);
  padding: 5px;
  width: 300px;
  margin: 10px;
}
</style>
