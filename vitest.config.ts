import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'happy-dom',
		include: ['test/**/*.test.ts'],
		environmentOptions: {
			happyDOM: {
				// Plugin injects a <script> tag; happy-dom otherwise throws when
				// it tries (and refuses) to load the external file.
				settings: { handleDisabledFileLoadingAsSuccess: true },
			},
		},
	},
})
