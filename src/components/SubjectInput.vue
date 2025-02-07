<template>
  <Fragment>
    <label for="subjects">Subjects:</label>
    <input
      id="subjects"
      type="text"
      v-model="localSubjects"
      @input="updateSubjects"
      placeholder="Enter subjects, comma-separated"
    />
  </Fragment>
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
  margin-right: 10px;
}
input {
  padding: 5px;
  width: 300px;
  margin: 10px;
}
</style>
