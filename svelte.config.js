
import adapter from "@sveltejs/adapter-cloudflare"
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: { adapter: adapter({
        platformProxy : {
            configPath: 'wrangler.toml',
            environment: undefined,
            experimentalJsonConfig: false,
            persist: false
        }
    }) },
	preprocess: [ vitePreprocess() ]
};

export default config;

