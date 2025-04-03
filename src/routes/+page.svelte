<script lang="ts">
  import FileTree from '$lib/components/FileTree.svelte';
  import FileSelector from '$lib/components/FileSelector.svelte';
  import OutputPanel from '$lib/components/OutputPanel.svelte';
  import ProcessingOptions from '$lib/components/ProcessingOptions.svelte';
</script>

<div class="container">
  <aside class="sidebar">
    <FileTree />
    <FileSelector />
    <ProcessingOptions />
  </aside>
  <main class="main-panel">
    <OutputPanel />
  </main>
</div>

<style>
  :global(body) {
    @apply bg-gray-900 text-gray-100;
  }

  .container {
    @apply flex flex-col md:flex-row h-screen overflow-hidden;
  }

  .sidebar {
    @apply w-full md:w-1/3 p-4 space-y-4 bg-gray-800 shadow-lg;
  }

  .main-panel {
    @apply w-full md:w-2/3 p-4 overflow-y-auto bg-gray-900;
  }

  :global(button) {
    @apply bg-emerald-600 text-white rounded-lg px-4 py-2 transition duration-300 ease-in-out hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300;
  }

  :global(.file-item) {
    @apply transition-colors duration-200 rounded-lg p-2 hover:bg-gray-700 cursor-pointer;
  }

  :global(.file-item.selected) {
    @apply bg-emerald-700 font-semibold border-l-4 border-emerald-400 text-white;
  }

  :global(.file-item.selected span) {
    @apply text-white;
  }

  :global(input[type="text"]) {
    @apply bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 w-full;
  }

  :global(input[type="checkbox"]) {
    @apply accent-emerald-500;
  }
</style>