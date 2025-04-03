import { writable } from 'svelte/store';

export interface ProcessingOptions {
  sortClasses: boolean;
  includeComments: boolean;
}

export interface FileData {
  path: string;
  name: string;
  isSelected: boolean;
}

function createAppStore() {
  const { subscribe, update, set } = writable({
    selectedFiles: [] as FileData[],
    currentDirectory: '',
    processingOptions: {
      sortClasses: false,
      includeComments: true
    } as ProcessingOptions,
    outputContent: '',
    isProcessing: false
  });

  return {
    subscribe,
    addFile: (file: FileData) => update(store => ({
      ...store,
      selectedFiles: [...store.selectedFiles, file]
    })),
    removeFile: (filePath: string) => update(store => ({
      ...store,
      selectedFiles: store.selectedFiles.filter(f => f.path !== filePath)
    })),
    setCurrentDirectory: (directory: string) => update(store => ({
      ...store,
      currentDirectory: directory
    })),
    updateProcessingOptions: (options: Partial<ProcessingOptions>) => update(store => ({
      ...store,
      processingOptions: { ...store.processingOptions, ...options }
    })),
    setOutputContent: (content: string) => update(store => ({
      ...store,
      outputContent: content
    })),
    reset: () => set({
      selectedFiles: [],
      currentDirectory: '',
      processingOptions: {
        sortClasses: false,
        includeComments: true
      },
      outputContent: '',
      isProcessing: false
    })
  };
}

export const appStore = createAppStore();