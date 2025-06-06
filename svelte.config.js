import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter(),
        alias: {
            $lib: './src/lib',
            $components: './src/components',
            $utils: './src/lib/utils',
            $services: './src/lib/services'
        }
    }
};

export default config;