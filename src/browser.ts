/* global window, document */

import type { AnalyticsPlugin } from 'analytics'
import type { EtrackerPluginConfig } from './types.js'

export type { EtrackerPluginConfig } from './types.js'

export const ETRACKER_SCRIPT_URL = '//code.etracker.com/code/e.js'
export const ETRACKER_LOADER_ID = '_etLoader'

type EtrackerApi = {
	sendEvent?: (event: unknown) => void
	enableCookies?: (domain?: string) => void
	disableCookies?: (domain?: string) => void
	areCookiesEnabled?: () => boolean
}

type UserDefinedEventConstructor = new (
	objectName: string,
	category: string,
	action?: string,
	type?: string
) => unknown

type PageProperties = {
	title?: string
	url?: string
}

type TrackPayload = {
	event: string
	properties: Record<string, unknown>
}

declare global {
	interface Window {
		_etrackerOnReady?: Array<() => void>
		_etracker?: EtrackerApi
		et_eC_Wrapper?: (parameters: Record<string, unknown>) => void
		et_UserDefinedEvent?: UserDefinedEventConstructor
	}
}

function fail(message: string): never {
	throw new Error(`[analytics-plugin-etracker] ${message}`)
}

const defaults = {
	scriptUrl: ETRACKER_SCRIPT_URL,
	blockCookies: false,
	respectDoNotTrack: true,
} satisfies Partial<EtrackerPluginConfig>

/**
 * etracker plugin.
 *
 * @example
 *
 * etracker({
 *   secureCode: 'XXXXXX',
 * })
 */
export default function etracker(options: EtrackerPluginConfig): AnalyticsPlugin {
	let loaded = false

	const config: EtrackerPluginConfig = {
		...defaults,
		...options,
	}

	if (!config.secureCode) {
		fail('Missing required option: secureCode')
	}

	return {
		name: 'etracker',
		config,
		loaded: () => loaded,
		initialize({ config }: { config: EtrackerPluginConfig }) {
			window._etrackerOnReady = window._etrackerOnReady || []

			injectScript(config)
				.then(() => (loaded = true))
				.catch((error) => console.error(error))
		},
		page({ payload: { properties } }: { payload: { properties: PageProperties } }) {
			trackPageView(config, properties)
		},
		track({ payload }: { payload: TrackPayload }) {
			trackUserDefinedEvent(payload.event, payload.properties)
		},
		identify() {
			// No-op: etracker has no generic visitor identification API.
		},
		methods: {
			updateCookieConsent(consented: boolean) {
				return updateCookieConsent(config, consented)
			},
		},
	}
}

function onReady(callback: () => void): void {
	window._etrackerOnReady = window._etrackerOnReady || []
	window._etrackerOnReady.push(callback)
}

export function updateCookieConsent(config: EtrackerPluginConfig, consented: boolean): void {
	onReady(() => {
		const domain = config.cookieDomain ?? window.location.hostname
		if (consented) {
			window._etracker?.enableCookies?.(domain)
		} else {
			window._etracker?.disableCookies?.(domain)
		}
	})
}

export function trackPageView(config: EtrackerPluginConfig, properties: PageProperties = {}): void {
	const parameters = buildPageViewParameters(config, properties)
	onReady(() => {
		window.et_eC_Wrapper?.(parameters)
	})
}

export function buildPageViewParameters(
	config: EtrackerPluginConfig,
	properties: PageProperties = {}
): Record<string, string> {
	const parameters: Record<string, string> = {
		et_et: String(config.secureCode),
		et_pagename: properties.title ?? document.title,
	}

	return parameters
}

export function trackUserDefinedEvent(event: string, properties: Record<string, unknown> = {}): void {
	const args = buildUserDefinedEventArgs(event, properties)
	onReady(() => {
		const UserDefinedEvent = window.et_UserDefinedEvent
		if (!UserDefinedEvent) {
			return
		}

		window._etracker?.sendEvent?.(new UserDefinedEvent(...args))
	})
}

export function buildUserDefinedEventArgs(
	event: string,
	properties: Record<string, unknown> = {}
): [string, string, string?, string?] {
	const objectName = stringify(properties.objectName ?? properties.object ?? properties.name ?? event)
	const category = stringify(properties.category ?? 'General')
	const action = stringify(properties.action ?? event)
	const type = properties.type == null ? undefined : stringify(properties.type)

	return type == null ? [objectName, category, action] : [objectName, category, action, type]
}

export function buildScriptAttributes(config: EtrackerPluginConfig): Record<string, string> {
	const attributes: Record<string, string> = {
		'data-secure-code': String(config.secureCode),
		'data-block-cookies': String(config.blockCookies ?? defaults.blockCookies),
		'data-respect-dnt': String(config.respectDoNotTrack ?? defaults.respectDoNotTrack),
	}

	for (const [name, value] of Object.entries(config.scriptAttributes ?? {})) {
		if (value == null) {
			continue
		}

		attributes[name.startsWith('data-') ? name : `data-${name}`] = String(value)
	}

	return attributes
}

/**
 * Inject the etracker loader script into the document.
 */
export function injectScript(config: EtrackerPluginConfig): Promise<void> {
	return new Promise((resolve, reject) => {
		if (document.getElementById(ETRACKER_LOADER_ID)) {
			resolve()
			return
		}

		const script = document.createElement('script')
		script.id = ETRACKER_LOADER_ID
		script.type = 'text/javascript'
		script.charset = 'UTF-8'
		script.async = true
		script.src = config.scriptUrl ?? ETRACKER_SCRIPT_URL

		for (const [name, value] of Object.entries(buildScriptAttributes(config))) {
			script.setAttribute(name, value)
		}

		script.addEventListener('load', () => resolve())
		script.addEventListener('error', () => reject(new Error(`Failed to load etracker script: ${script.src}`)))

		const el = document.getElementsByTagName('script')[0]
		if (el?.parentNode) {
			el.parentNode.insertBefore(script, el)
		} else {
			document.head.appendChild(script)
		}
	})
}

function stringify(value: unknown): string {
	return String(value)
}
