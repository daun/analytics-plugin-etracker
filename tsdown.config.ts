import { defineConfig } from 'tsdown';

export default defineConfig({
		entry: ['src/browser.ts', 'src/node.ts'],
		format: ['esm'],
		platform: 'browser',
		dts: true,
		clean: true,
		minify: true,
		deps: { onlyBundle: false, neverBundle: ['analytics'] },
	});
