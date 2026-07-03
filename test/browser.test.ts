/* global window, document */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Analytics from 'analytics'
import etracker, {
	buildPageViewParameters,
	buildScriptAttributes,
	buildUserDefinedEventArgs,
	injectScript,
} from '../src/browser.js'
import type { EtrackerPluginConfig } from '../src/types.js'

const baseOptions: EtrackerPluginConfig = {
	secureCode: 'secure-123',
}

type EtrackerMethods = {
	updateCookieConsent: (consented: boolean) => void
}

function setup(options: EtrackerPluginConfig = baseOptions) {
	const plugin = etracker(options)
	const analytics = Analytics({ app: 'test-app', plugins: [plugin] })
	plugin.initialize?.({ config: plugin.config })
	const hoisted = (analytics.plugins as unknown as Record<string, EtrackerMethods>).etracker
	return Object.assign(plugin, hoisted)
}

function flushReadyCallbacks() {
	for (const callback of window._etrackerOnReady ?? []) {
		callback()
	}
}

beforeEach(() => {
	document.head.innerHTML = ''
	window._etrackerOnReady = []
	delete window._etracker
	delete window.et_eC_Wrapper
	delete window.et_UserDefinedEvent
})

describe('required options', () => {
	it('does not throw when required options are present', () => {
		expect(() => etracker(baseOptions)).not.toThrow()
	})

	it('throws when secureCode is empty', () => {
		// @ts-expect-error testing missing required option
		expect(() => etracker({})).toThrow(/secureCode/)
		expect(() => etracker({ secureCode: null })).toThrow(/secureCode/)
		expect(() => etracker({ secureCode: '' })).toThrow(/secureCode/)
	})
})

describe('initialize', () => {
	it('creates the ready queue and injects the loader script', () => {
		setup()

		const script = document.querySelector('#_etLoader') as HTMLScriptElement
		expect(script).not.toBeNull()
		expect(script.type).toBe('text/javascript')
		expect(script.async).toBe(true)
		expect(script.getAttribute('charset')).toBe('UTF-8')
		expect(script.getAttribute('data-secure-code')).toBe('secure-123')
		expect(script.getAttribute('data-block-cookies')).toBe('false')
		expect(script.getAttribute('data-respect-dnt')).toBe('true')
		expect(script.getAttribute('src')).toBe('//code.etracker.com/code/e.js')
		expect(window._etrackerOnReady).toEqual([])
	})

})

describe('buildScriptAttributes', () => {
	it('builds etracker loader data attributes', () => {
		expect(buildScriptAttributes(baseOptions)).toEqual({
			'data-secure-code': 'secure-123',
			'data-block-cookies': 'false',
			'data-respect-dnt': 'true',
		})
	})

	it('honours privacy and extra data attributes', () => {
		expect(
			buildScriptAttributes({
				...baseOptions,
				blockCookies: true,
				respectDoNotTrack: false,
				scriptAttributes: {
					'cmp-ab': 1,
					'data-cookieconsent': 'ignore',
					skipped: null,
				},
			})
		).toEqual({
			'data-secure-code': 'secure-123',
			'data-block-cookies': 'true',
			'data-respect-dnt': 'false',
			'data-cmp-ab': '1',
			'data-cookieconsent': 'ignore',
		})
	})
})

describe('injectScript', () => {
	it('inserts an async script and resolves on load', async () => {
		const promise = injectScript(baseOptions)

		const script = document.querySelector('#_etLoader') as HTMLScriptElement
		expect(script).not.toBeNull()
		expect(script.async).toBe(true)

		script.dispatchEvent(new Event('load'))
		await expect(promise).resolves.toBeUndefined()
	})

	it('does not insert a duplicate loader', async () => {
		document.head.appendChild(document.createElement('script')).id = '_etLoader'

		await expect(injectScript(baseOptions)).resolves.toBeUndefined()
		expect(document.querySelectorAll('#_etLoader')).toHaveLength(1)
	})
})

describe('page', () => {
	it('queues an etracker SPA page view', () => {
		const wrapper = vi.fn()
		window.et_eC_Wrapper = wrapper
		const plugin = setup()

		plugin.page?.({ payload: { properties: { title: 'Home' } } })
		flushReadyCallbacks()

		expect(wrapper).toHaveBeenCalledWith({
			et_et: 'secure-123',
			et_pagename: 'Home',
		})
	})

	it('builds page view parameters from document title', () => {
		document.title = 'Fallback Title'

		expect(buildPageViewParameters(baseOptions)).toEqual({
			et_et: 'secure-123',
			et_pagename: 'Fallback Title',
		})
	})
})

describe('track', () => {
	it('queues a user-defined event', () => {
		const sendEvent = vi.fn()
		window._etracker = { sendEvent }
		window.et_UserDefinedEvent = class {
			args: unknown[]

			constructor(...args: [string, string, string?, string?]) {
				this.args = args
			}
		}
		const plugin = setup()

		plugin.track?.({
			payload: {
				event: 'signup',
				properties: { category: 'auth', objectName: 'CTA', type: 'click' },
			},
		})
		flushReadyCallbacks()

		expect(sendEvent).toHaveBeenCalledTimes(1)
		expect(sendEvent.mock.calls[0]?.[0]).toMatchObject({ args: ['CTA', 'auth', 'signup', 'click'] })
	})

	it('builds user-defined event arguments with defaults', () => {
		expect(buildUserDefinedEventArgs('signup')).toEqual(['signup', 'General', 'signup'])
		expect(buildUserDefinedEventArgs('signup', { name: 'CTA', category: 'auth', action: 'click' })).toEqual([
			'CTA',
			'auth',
			'click',
		])
	})
})

describe('identify', () => {
	it('is a no-op', () => {
		const plugin = setup()

		expect(() => plugin.identify?.({ payload: { userId: 'user-1' } })).not.toThrow()
	})
})

describe('methods', () => {
	it('updateCookieConsent enables and disables cookies', () => {
		const enableCookies = vi.fn()
		const disableCookies = vi.fn()
		window._etracker = { enableCookies, disableCookies }
		const plugin = setup({ ...baseOptions, cookieDomain: 'example.com' })

		plugin.updateCookieConsent(true)
		plugin.updateCookieConsent(false)
		flushReadyCallbacks()

		expect(enableCookies).toHaveBeenCalledWith('example.com')
		expect(disableCookies).toHaveBeenCalledWith('example.com')
	})
})
