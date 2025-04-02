<script lang="ts">
    import { appStore } from '$lib/stores/appStore';
    import type { FileData } from '$lib/stores/appStore';
  
    function removeFile(file: FileData) {
      appStore.removeFile(file.path);
    }
  
    function clearAllFiles() {
      appStore.reset();
    }
  </script>
  
  <div class="file-selector-container">
    <h3>Selected Files</h3>
    
    {#if $appStore.selectedFiles.length === 0}
      <p class="no-files-message">No files selected</p>
    {:else}
      <ul class="file-list">
        {#each $appStore.selectedFiles as file}
          <li class="file-item">
            <span>{file.name}</span>
            <button 
              class="remove-file-btn" 
              on:click={() => removeFile(file)}
            >
              ✕
            </button>
          </li>
        {/each}
      </ul>
  
      <div class="file-selector-actions">
        <button 
          class="clear-files-btn" 
          on:click={clearAllFiles}
        >
          Clear All Files
        </button>
      </div>
    {/if}
  </div>
  
  <style>
    .file-selector-container {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      margin-top: 10px;
    }
  
    .no-files-message {
      color: #888;
      text-align: center;
    }
  
    .file-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }
  
    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px;
      border-bottom: 1px solid #eee;
    }
  
    .file-item:last-child {
      border-bottom: none;
    }
  
    .remove-file-btn {
      background-color: #ff4d4d;
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  
    .file-selector-actions {
      margin-top: 10px;
      text-align: center;
    }
  
    .clear-files-btn {
      background-color: #ff6b6b;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>