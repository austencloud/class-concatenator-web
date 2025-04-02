<script lang="ts">
	import { appStore } from '$lib/stores/appStore';
	import type { FileData } from '$lib/stores/appStore';

	// File type processors
	interface FileProcessor {
		processFile(file: File, options: ProcessingOptions): Promise<ProcessedFileContent>;
	}

	interface ProcessingOptions {
		includeComments: boolean;
		sortClasses: boolean;
		removeDuplicateImports: boolean;
	}

	interface ProcessedFileContent {
		fileName: string;
		originalContent: string;
		extractedClasses: ClassInfo[];
		imports: string[];
	}

	interface ClassInfo {
		name: string;
		type: string;
		inheritance?: string;
		docstring?: string;
		content: string;
	}

	// Processors for different file types
	class PythonProcessor implements FileProcessor {
		async processFile(file: File, options: ProcessingOptions): Promise<ProcessedFileContent> {
			const content = await this.readFile(file);

			// Import processing
			const imports = this.extractImports(content);

			// Class extraction
			const classes = this.extractClasses(content, options.includeComments);

			// Sort classes if required
			if (options.sortClasses) {
				classes.sort((a, b) => a.name.localeCompare(b.name));
			}

			return {
				fileName: file.name,
				originalContent: content,
				extractedClasses: classes,
				imports
			};
		}

		private async readFile(file: File): Promise<string> {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = (e) => resolve(e.target?.result as string);
				reader.onerror = (e) => reject(e);
				reader.readAsText(file);
			});
		}

		private extractImports(content: string): string[] {
			const importRegex = /^(from\s+\w+\s+import\s+\w+|import\s+\w+)/gm;
			return Array.from(new Set(content.match(importRegex) || []));
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
			const content = await this.readFile(file);

			// Import processing
			const imports = this.extractImports(content);

			// Class extraction
			const classes = this.extractClasses(content, options.includeComments);

			// Sort classes if required
			if (options.sortClasses) {
				classes.sort((a, b) => a.name.localeCompare(b.name));
			}

			return {
				fileName: file.name,
				originalContent: content,
				extractedClasses: classes,
				imports
			};
		}

		private async readFile(file: File): Promise<string> {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = (e) => resolve(e.target?.result as string);
				reader.onerror = (e) => reject(e);
				reader.readAsText(file);
			});
		}

		private extractImports(content: string): string[] {
			const importRegex = /^(import\s+{?[\w\s,]+}?\s+from\s+['"][^'"]+['"])/gm;
			return Array.from(new Set(content.match(importRegex) || []));
		}

		private extractClasses(content: string, includeComments: boolean): ClassInfo[] {
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
			const content = await this.readFile(file);

			// Extract script content
			const scriptContent = this.extractScriptContent(content);

			// Import processing
			const imports = this.extractImports(scriptContent);

			// Class extraction
			const classes = this.extractClasses(scriptContent, options.includeComments);

			// Sort classes if required
			if (options.sortClasses) {
				classes.sort((a, b) => a.name.localeCompare(b.name));
			}

			return {
				fileName: file.name,
				originalContent: content,
				extractedClasses: classes,
				imports
			};
		}

		private async readFile(file: File): Promise<string> {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = (e) => resolve(e.target?.result as string);
				reader.onerror = (e) => reject(e);
				reader.readAsText(file);
			});
		}

		private extractScriptContent(content: string): string {
			const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
			return scriptMatch ? scriptMatch[1] : '';
		}

		private extractImports(content: string): string[] {
			const importRegex = /^import\s+(?:type\s+)?(?:\w+,?\s*)*(?:from\s+['"][^'"]+['"])?/gm;
			return Array.from(new Set(content.match(importRegex) || []));
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

	// Processor selection
	const FILE_PROCESSORS: { [key: string]: FileProcessor } = {
		'.py': new PythonProcessor(),
		'.ts': new TypeScriptProcessor(),
		'.svelte': new SvelteProcessor(),
		'.js': new TypeScriptProcessor(),
		'.tsx': new TypeScriptProcessor(),
		'.jsx': new TypeScriptProcessor()
	};

	// Component logic
	let processingProgress = 0;
	let isProcessing = false;
	let processedFiles: ProcessedFileContent[] = [];

	async function processFiles() {
		// Validate file selection
		if ($appStore.selectedFiles.length === 0) {
			alert('Please select files to process');
			return;
		}

		// Reset processing state
		isProcessing = true;
		processingProgress = 0;
		processedFiles = [];

		try {
			// Get file input from the FileTree component
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const files = fileInput?.files;

			if (!files) {
				throw new Error('No files selected');
			}

			// Process each file
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

				// Select appropriate processor
				const processor = FILE_PROCESSORS[fileExt];
				if (!processor) {
					console.warn(`Unsupported file type: ${file.name}`);
					continue;
				}

				// Process file
				const processedFile = await processor.processFile(file, $appStore.processingOptions);

				processedFiles.push(processedFile);

				// Update progress
				processingProgress = Math.floor(((i + 1) / files.length) * 100);
			}

			// Generate output content
			const outputContent = processedFiles
				.map(
					(file) =>
						`\n\n# File: ${file.fileName}\n` +
						(file.imports.length > 0 ? file.imports.join('\n') + '\n' : '') +
						file.originalContent
				)
				.join('\n');

			// Update app store
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
</style>
