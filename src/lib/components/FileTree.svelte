<script lang="ts">
	import { onMount } from 'svelte';
	import { appStore, type FileData } from '$lib/stores/appStore';

	// Define supported file extensions
	const SUPPORTED_EXTENSIONS = [
		'.py', // Python
		'.ts', // TypeScript
		'.js', // JavaScript
		'.svelte', // Svelte
		'.tsx', // TypeScript React
		'.jsx' // JavaScript React
	];

	let files: FileData[] = [];
	let searchTerm = '';
	let fileInput: HTMLInputElement | null = null;

	// Recursive function to traverse directories
	async function traverseFileTree(item: FileSystemEntry, path: string = ''): Promise<FileData[]> {
		return new Promise((resolve) => {
			if (item.isFile) {
				(item as FileSystemFileEntry).file((file: File) => {
					// Check if file has a supported extension
					if (SUPPORTED_EXTENSIONS.some((ext) => file.name.endsWith(ext))) {
						resolve([
							{
								path: path + file.name,
								name: file.name,
								isSelected: true
							}
						]);
					} else {
						resolve([]);
					}
				});
			} else if (item.isDirectory) {
				const dirReader = (item as FileSystemDirectoryEntry).createReader();
				dirReader.readEntries(async (entries) => {
					const filePromises = entries.map(
						async (entry) => await traverseFileTree(entry, path + item.name + '/')
					);

					const nestedFiles = await Promise.all(filePromises);
					resolve(nestedFiles.flat());
				});
			} else {
				resolve([]);
			}
		});
	}

	async function loadDirectory() {
		fileInput?.click();
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files) return;

		// Reset files and app store first
		files = [];
		appStore.reset();

		// Convert FileList to array and process each file
		const fileArray = Array.from(input.files);

		// Filter for supported file types
		const supportedFiles = fileArray.filter((file) =>
			SUPPORTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext.toLowerCase()))
		);

		// Convert supported files to FileData
		files = supportedFiles.map((file) => ({
			path: file.webkitRelativePath || file.name,
			name: file.name,
			isSelected: true
		}));

		// Add files to app store
		files.forEach((file) => appStore.addFile(file));
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

	$: filteredFiles = files.filter((file) =>
		file.name.toLowerCase().includes(searchTerm.toLowerCase())
	);
</script>

<div class="file-tree-container">
	<div class="file-tree-header">
		<button class="select-directory-btn" on:click={loadDirectory}> Select Folder </button>
		<input
			type="file"
			bind:this={fileInput}
			on:change={handleFileSelect}
			multiple
			{...{ webkitdirectory: true }}
			style="display: none;"
		/>
		<input
			type="text"
			placeholder="Search files..."
			bind:value={searchTerm}
			class="file-search-input"
		/>
	</div>

	<div class="file-list">
		{#if files.length === 0}
			<p class="no-files-message">No supported files selected</p>
		{:else}
			<div class="file-summary">
				<span>Total files: {files.length}</span>
			</div>
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
					<span>{file.path}</span>
				</div>
			{/each}
		{/if}
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
		background-color: #4caf50;
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

	.file-summary {
		background-color: #f0f0f0;
		padding: 5px;
		text-align: right;
		font-size: 0.8em;
		color: #666;
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
		background-color: #d1fae5; /* Tailwind's emerald-100 */
		border-left: 4px solid #10b981; /* Tailwind's emerald-500 */
		font-weight: 600;
	}

	.file-item input[type='checkbox'] {
		margin-right: 10px;
	}

	.no-files-message {
		color: #888;
		text-align: center;
		padding: 10px;
	}
</style>
