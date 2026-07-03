import type { AnalyticsPlugin } from 'analytics'
import type { EtrackerPluginConfig } from './types.js'

export type { EtrackerPluginConfig } from './types.js'

const name = 'etracker'

const logMessage = () => {
	console.log(`${name} tracking is not available in node.js.`)
}

export default function etrackerPlugin(config: Partial<EtrackerPluginConfig> = {}): AnalyticsPlugin {
	return {
		name,
		config: { ...config },
		initialize: () => logMessage(),
		page: () => logMessage(),
		track: () => logMessage(),
		identify: () => logMessage(),
	}
}
