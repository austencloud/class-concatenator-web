<script lang="ts">
	import { appStore } from '$lib/stores/appStore';

	function updateSortClasses(event: Event) {
		const target = event.target as HTMLInputElement;
		appStore.updateProcessingOptions({
			sortClasses: target.checked
		});
	}

	function updateRemoveDuplicates(event: Event) {
		const target = event.target as HTMLInputElement;
		appStore.updateProcessingOptions({
			removeDuplicateImports: target.checked
		});
	}

	function updateIncludeComments(event: Event) {
		const target = event.target as HTMLInputElement;
		appStore.updateProcessingOptions({
			includeComments: target.checked
		});
	}
</script>

<div class="processing-options-container">
	<h3>Processing Options</h3>

	<div class="option-group">
		<label class="option-label">
			<input
				type="checkbox"
				checked={$appStore.processingOptions.sortClasses}
				on:change={updateSortClasses}
			/>
			Sort Classes Alphabetically
		</label>
	</div>

	<div class="option-group">
		<label class="option-label">
			<input
				type="checkbox"
				checked={$appStore.processingOptions.removeDuplicateImports}
				on:change={updateRemoveDuplicates}
			/>
			Remove Duplicate Imports
		</label>
	</div>

	<div class="option-group">
		<label class="option-label">
			<input
				type="checkbox"
				checked={$appStore.processingOptions.includeComments}
				on:change={updateIncludeComments}
			/>
			Include Comments
		</label>
	</div>
</div>

<style>
	.processing-options-container {
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 10px;
		margin-top: 10px;
	}

	.option-group {
		margin-bottom: 10px;
	}

	.option-label {
		display: flex;
		align-items: center;
		cursor: pointer;
	}

	.option-label input {
		margin-right: 10px;
	}
</style>
