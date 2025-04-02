<script lang="ts">
    import FileTree from '$lib/components/FileTree.svelte';
    import FileSelector from '$lib/components/FileSelector.svelte';
    import OutputPanel from '$lib/components/OutputPanel.svelte';
    import ProcessingOptions from '$lib/components/ProcessingOptions.svelte';
  </script>
  
  <div class="container mx-auto p-4 flex space-x-4">
    <div class="w-1/3">
      <FileTree />
      <FileSelector />
      <ProcessingOptions />
    </div>
    <div class="w-2/3">
      <OutputPanel />
    </div>
  </div>
  
  <style>
    .container {
      display: flex;
      height: 100vh;
    }
  </style>