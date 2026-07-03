/**
 * Configuration options for the etracker analytics plugin.
 */
export interface EtrackerPluginConfig {
	/** etracker account key/security code from Settings → Integration → Tracking code. Required. */
	secureCode: string | null

	/** Tracking script URL. Defaults to `//code.etracker.com/code/e.js`. */
	scriptUrl?: string | null

	/** Run etracker without cookies until consent is granted. Default: `false`. */
	blockCookies?: boolean

	/** Respect the browser's Do Not Track setting. Default: `true`. */
	respectDoNotTrack?: boolean

	/** Cookie domain passed to etracker's cookie consent API. Defaults to `window.location.hostname`. */
	cookieDomain?: string

	/** Additional attributes for the etracker loader script. */
	scriptAttributes?: Record<string, string | number | boolean | null | undefined>
}
