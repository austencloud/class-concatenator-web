<script lang="ts">
	import { appStore } from '$lib/stores/appStore';
	import { ClassExtractor } from '$lib/utils/classExtractor';
	import { ImportCollector } from '$lib/utils/importCollector';

	let processingProgress = 0;
	let isProcessing = false;
	async function readFile(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target?.result as string);
			reader.onerror = (e) => reject(e);
			reader.readAsText(file);
		});
	}

	async function processFiles() {
		if ($appStore.selectedFiles.length === 0) {
			alert('Please select files to process');
			return;
		}

		isProcessing = true;
		processingProgress = 0;

		try {
			const results: string[] = [];
			const classExtractor = new ClassExtractor();
			const importCollector = new ImportCollector();

			// Get file input from the FileTree component
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const files = fileInput?.files;

			if (!files) {
				throw new Error('No files selected');
			}

			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				if (!file.name.endsWith('.py')) continue;

				const fileContent = await readFile(file);

				// Process imports
				importCollector.processImports(fileContent);

				// Extract classes
				const classes = classExtractor.extractClasses(
					fileContent,
					$appStore.processingOptions.includeComments
				);

				// Sort classes if option is enabled
				if ($appStore.processingOptions.sortClasses) {
					classes.sort((a, b) => a.name.localeCompare(b.name));
				}

				// Add file header and content
				results.push(`\n\n# File: ${file.name}`);
				results.push(fileContent);

				processingProgress = Math.floor(((i + 1) / files.length) * 100);
			}

			// Generate final output
			const outputContent = [
				// Add import block if needed
				$appStore.processingOptions.removeDuplicateImports
					? importCollector.generateImportBlock()
					: '',
				...results
			].join('\n');

			appStore.setOutputContent(outputContent);
		} catch (error) {
			console.error('Processing error:', error);
			alert(`Error processing files: ${error}`);
		} finally {
			isProcessing = false;
			processingProgress = 0;
		}
	}

	function copyToClipboard() {
		if ($appStore.outputContent) {
			navigator.clipboard
				.writeText($appStore.outputContent)
				.then(() => alert('Copied to clipboard'))
				.catch((err) => console.error('Could not copy text: ', err));
		}
	}

	function saveToFile() {
		if (!$appStore.outputContent) {
			alert('No content to save');
			return;
		}

		const blob = new Blob([$appStore.outputContent], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'concatenated_classes.py';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
</script>

<div class="output-panel-container">
	<div class="output-panel-header">
		<h3>Concatenated Output</h3>
		<div class="output-actions">
			<button
				on:click={processFiles}
				disabled={isProcessing || $appStore.selectedFiles.length === 0}
			>
				{isProcessing ? 'Processing...' : 'Process Files'}
			</button>
			<button on:click={copyToClipboard} disabled={!$appStore.outputContent}>
				Copy to Clipboard
			</button>
			<button on:click={saveToFile} disabled={!$appStore.outputContent}> Save to File </button>
		</div>
	</div>

	{#if isProcessing}
		<div class="progress-bar">
			<div class="progress" style="width: {processingProgress}%"></div>
		</div>
	{/if}

	<div class="output-content">
		{#if $appStore.outputContent}
			<pre>{$appStore.outputContent}</pre>
		{:else}
			<p class="placeholder">Processed files will appear here</p>
		{/if}
	</div>
</div>

<style>
	.output-panel-container {
		border: 1px solid #ddd;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.output-panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px;
		border-bottom: 1px solid #eee;
	}

	.output-actions {
		display: flex;
		gap: 10px;
	}

	.output-actions button {
		padding: 5px 10px;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.progress-bar {
		height: 5px;
		background-color: #f0f0f0;
	}

	.progress {
		height: 100%;
		background-color: #4caf50;
		transition: width 0.5s ease;
	}

	.output-content {
		flex-grow: 1;
		overflow-y: auto;
		padding: 10px;
	}

	.output-content pre {
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.placeholder {
		color: #888;
		text-align: center;
	}
</style>
