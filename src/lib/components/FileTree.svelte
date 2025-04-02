<script lang="ts">
  import { onMount } from 'svelte';
  import { appStore, type FileData } from '$lib/stores/appStore';

  let files: FileData[] = [];
  let searchTerm = '';
  let fileInput: HTMLInputElement | null = null;

  async function loadDirectory() {
    fileInput?.click();
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    files = Array.from(input.files)
      .filter(file => file.name.endsWith('.py'))
      .map(file => ({
        path: (file as any).webkitRelativePath || file.name,
        name: file.name,
        isSelected: false
      }));
    
    // Add all files to the store
    files.forEach(file => appStore.addFile(file));
  }

  function toggleFileSelection(file: FileData) {
    file.isSelected = !file.isSelected;
    
    if (file.isSelected) {
      appStore.addFile(file);
    } else {
      appStore.removeFile(file.path);
    }

    // Trigger reactivity
    files = [...files];
  }

  $: filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
</script>

<div class="file-tree-container">
  <div class="file-tree-header">
    <button 
      class="select-directory-btn" 
      on:click={loadDirectory}
    >
      Select Files
    </button>
    <input 
      type="text" 
      placeholder="Search files..." 
      bind:value={searchTerm}
      class="file-search-input"
    />
    <input 
      type="file" 
      bind:this={fileInput}
      on:change={handleFileSelect}
      multiple 
      accept=".py"
      data-directory
      style="display: none;"
    />
  </div>

  <div class="file-list">
    {#each filteredFiles as file}
      <div 
        class="file-item" 
        class:selected={file.isSelected}
        role="button"
        tabindex="0"
        on:click={() => toggleFileSelection(file)}
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleFileSelection(file)}
      >
        <input 
          type="checkbox" 
          checked={file.isSelected}
          on:click|stopPropagation={() => toggleFileSelection(file)}
        />
        <span>{file.name}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .file-tree-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    max-height: 400px;
    overflow-y: auto;
  }

  .file-tree-header {
    display: flex;
    margin-bottom: 10px;
  }

  .select-directory-btn {
    margin-right: 10px;
    padding: 5px 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
  }

  .file-search-input {
    flex-grow: 1;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .file-list {
    display: flex;
    flex-direction: column;
  }

  .file-item {
    display: flex;
    align-items: center;
    padding: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .file-item:hover {
    background-color: #f0f0f0;
  }

  .file-item.selected {
    background-color: #e0e0e0;
  }

  .file-item input[type="checkbox"] {
    margin-right: 10px;
  }
</style>