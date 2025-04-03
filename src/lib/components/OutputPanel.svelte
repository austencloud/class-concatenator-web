<script lang="ts">
	import { appStore } from '$lib/stores/appStore';
	import type { FileData } from '$lib/stores/appStore';
	import { readFileAsText } from '$lib/utils/fileUtils';

	const DEBUG_MODE = false; // toggle if you want console logs

	// File type processors
	interface FileProcessor {
		processFile(file: File, options: ProcessingOptions): Promise<ProcessedFileContent>;
	}

	interface ProcessingOptions {
		includeComments: boolean;
		sortClasses: boolean;
	}

	interface ProcessedFileContent {
		fileName: string;
		originalContent: string;
		extractedClasses: ClassInfo[];
	}

	interface ClassInfo {
		name: string;
		type: string;
		inheritance?: string;
		docstring?: string;
		content: string;
	}

	class PythonProcessor implements FileProcessor {
		async processFile(file: File, options: ProcessingOptions): Promise<ProcessedFileContent> {
			const content = await readFileAsText(file);

			const classes = this.extractClasses(content, options.includeComments);

			if (options.sortClasses) {
				classes.sort((a, b) => a.name.localeCompare(b.name));
			}

			return {
				fileName: file.name,
				originalContent: content,
				extractedClasses: classes
			};
		}

		private extractClasses(content: string, includeComments: boolean): ClassInfo[] {
			const classPattern = /^\s*class\s+(\w+)(?:\s*\(\s*(\w+)?\s*\))?:\s*(?:"""(.*?)""")?/gms;
			const classes: ClassInfo[] = [];

			let match;
			while ((match = classPattern.exec(content)) !== null) {
				const [fullMatch, className, inheritance, docstring] = match;
				classes.push({
					name: className,
					type: 'class',
					inheritance: inheritance || undefined,
					docstring: docstring ? docstring.trim() : undefined,
					content: fullMatch
				});
			}

			return classes;
		}
	}

	class TypeScriptProcessor implements FileProcessor {
		async processFile(file: File, options: ProcessingOptions): Promise<ProcessedFileContent> {
			const content = await readFileAsText(file);

			const classes = this.extractClasses(content, options.includeComments);

			if (options.sortClasses) {
				classes.sort((a, b) => a.name.localeCompare(b.name));
			}

			return {
				fileName: file.name,
				originalContent: content,
				extractedClasses: classes
			};
		}

		private extractClasses(content: string, includeComments: boolean): ClassInfo[] {
			// Basic naive extraction
			const classPattern = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
			const classes: ClassInfo[] = [];

			let match;
			while ((match = classPattern.exec(content)) !== null) {
				const [fullMatch, className, inheritance] = match;
				classes.push({
					name: className,
					type: 'class',
					inheritance: inheritance || undefined,
					content: fullMatch
				});
			}
			return classes;
		}
	}

	class SvelteProcessor implements FileProcessor {
		async processFile(file: File, options: ProcessingOptions): Promise<ProcessedFileContent> {
			const content = await readFileAsText(file);

			const scriptContent = this.extractScriptContent(content);
			const classes = this.extractClasses(scriptContent, options.includeComments);

			if (options.sortClasses) {
				classes.sort((a, b) => a.name.localeCompare(b.name));
			}

			return {
				fileName: file.name,
				originalContent: content,
				extractedClasses: classes
			};
		}

		private extractScriptContent(content: string): string {
			const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
			return scriptMatch ? scriptMatch[1] : '';
		}

		private extractClasses(content: string, includeComments: boolean): ClassInfo[] {
			const classPattern = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
			const classes: ClassInfo[] = [];

			let match;
			while ((match = classPattern.exec(content)) !== null) {
				const [fullMatch, className, inheritance] = match;
				classes.push({
					name: className,
					type: 'class',
					inheritance: inheritance || undefined,
					content: fullMatch
				});
			}
			return classes;
		}
	}

	const FILE_PROCESSORS: { [key: string]: FileProcessor } = {
		'.py': new PythonProcessor(),
		'.ts': new TypeScriptProcessor(),
		'.svelte': new SvelteProcessor(),
		'.js': new TypeScriptProcessor(),
		'.tsx': new TypeScriptProcessor(),
		'.jsx': new TypeScriptProcessor()
	};

	let processingProgress = 0;
	let isProcessing = false;
	let processedFiles: ProcessedFileContent[] = [];
	let errorMessage: string = '';

	// Called by button in UI
	async function processFiles() {
		// Clear any previous errors
		errorMessage = '';

		// Validate file selection
		if ($appStore.selectedFiles.length === 0) {
			errorMessage = 'Please select files to process';
			return;
		}

		// Reset processing state
		isProcessing = true;
		processingProgress = 0;
		processedFiles = [];

		try {
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const files = fileInput?.files;
			if (!files) {
				throw new Error('No files selected');
			}

			if (DEBUG_MODE) {
				console.log('===== FILE PROCESSING START =====');
				console.log('Total files in input:', files.length);
			}

			// Filter to only supported types
			const supportedFiles = Array.from(files).filter((file) => {
				const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
				return FILE_PROCESSORS[fileExt] !== undefined;
			});

			if (DEBUG_MODE) {
				console.log(`Total files: ${files.length}, Supported files: ${supportedFiles.length}`);
			}

			// Simple concatenation approach
			let combinedOutput = '';

			for (let i = 0; i < supportedFiles.length; i++) {
				const file = supportedFiles[i];
				const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
				const processor = FILE_PROCESSORS[fileExt];

				if (!processor) {
					// Shouldn't happen, but just in case
					continue;
				}

				const processedFile = await processor.processFile(file, $appStore.processingOptions);
				processedFiles.push(processedFile);

				// Add a file header and original content
				combinedOutput += `\n\n# File: ${processedFile.fileName}\n${processedFile.originalContent}`;

				processingProgress = Math.floor(((i + 1) / supportedFiles.length) * 100);
			}

			// Save to store
			appStore.setOutputContent(combinedOutput.trim());

			if (DEBUG_MODE) {
				console.log('===== FILE PROCESSING END =====');
			}
		} catch (error: any) {
			if (DEBUG_MODE) {
				console.error('Processing error:', error);
			}
			errorMessage = error?.message || `Error processing files: ${error}`;
		} finally {
			isProcessing = false;
			processingProgress = 0;
		}
	}

	function copyToClipboard() {
		if ($appStore.outputContent) {
			navigator.clipboard
				.writeText($appStore.outputContent)
				.then(() => (errorMessage = 'Copied to clipboard!'))
				.catch((err) => (errorMessage = `Could not copy: ${err}`));
		}
	}

	function saveToFile() {
		if (!$appStore.outputContent) {
			errorMessage = 'No content to save';
			return;
		}
		const blob = new Blob([$appStore.outputContent], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'concatenated_files.txt';
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
			<button on:click={processFiles} disabled={isProcessing || $appStore.selectedFiles.length === 0}>
				{isProcessing ? 'Processing...' : 'Process Files'}
			</button>
			<button on:click={copyToClipboard} disabled={!$appStore.outputContent}>
				Copy to Clipboard
			</button>
			<button on:click={saveToFile} disabled={!$appStore.outputContent}>
				Save to File
			</button>
		</div>
	</div>

	<!-- Show error or info messages here -->
	{#if errorMessage}
		<div class="error-message">
			{errorMessage}
		</div>
	{/if}

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

	.output-actions button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
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

	.error-message {
		padding: 5px 10px;
		color: #b00;
		font-weight: bold;
	}
</style>