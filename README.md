# etracker Plugin for `analytics`

[etracker](https://www.etracker.com/) integration for [analytics](https://www.npmjs.com/package/analytics), a lightweight open-source frontend analytics abstraction layer.

## Installation

Install `analytics` and `analytics-plugin-etracker` packages.

```bash
npm install analytics
npm install analytics-plugin-etracker
```

## Setup

Initialize the plugin with analytics.

```js
import Analytics from 'analytics'
import etrackerPlugin from 'analytics-plugin-etracker'

const analytics = Analytics({
  app: 'awesome-app',
  plugins: [
    etrackerPlugin({
      secureCode: 'XXXXXX',
    })
  ]
})
```

`secureCode` is the etracker account key/security code from Settings → Integration → Tracking code.

## Usage

The plugin loads etracker's tracking script and sends data whenever [analytics.page](https://getanalytics.io/api/#analyticspage) or [analytics.track](https://getanalytics.io/api/#analyticstrack) is called.

If you already include the etracker tracking script in your templates, remove it to avoid double tracking.

```js
/* Track a page view */
analytics.page({
  title: 'Cart'
})

/* Track a custom event */
analytics.track('Add', {
  category: 'Cart',
  objectName: 'Ice Cubes',
  type: 'click'
})
```

## API

### Core methods

- **[analytics.page](https://getanalytics.io/api/#analyticspage)** - Send a virtual page view through `et_eC_Wrapper`.
- **[analytics.track](https://getanalytics.io/api/#analyticstrack)** - Send an etracker user-defined event.

### Plugin methods

#### `updateCookieConsent(consented)`

Grant or revoke cookie consent through etracker's cookie API.

```js
analytics.plugins.etracker.updateCookieConsent(true)
analytics.plugins.etracker.updateCookieConsent(false)
```

## Configuration

### Registration

- **`secureCode`** — etracker account key/security code. Required.
- **`scriptUrl`** — Custom tracking script URL. Defaults to `//code.etracker.com/code/e.js`.

### Privacy & Cookies

- **`blockCookies`** — Add `data-block-cookies` to run etracker without cookies until consent is granted. Default: `false`.
- **`respectDoNotTrack`** — Add `data-respect-dnt`. Default: `true`.
- **`cookieDomain`** — Domain passed to `enableCookies` and `disableCookies`. Defaults to `window.location.hostname`.
- **`scriptAttributes`** — Additional loader attributes, for example CMP bypass attributes.

### Single-Page Applications

The plugin sends manual virtual page views through `et_eC_Wrapper` when `analytics.page()` is called. etracker reads the URL from `document.location.href`; custom URLs passed to `analytics.page()` are not forwarded.

## Consent Handling

Set `blockCookies: true` to make the loader receive `data-block-cookies="true"` so etracker can run without cookies until consent is granted. Call `updateCookieConsent(true)` after cookie consent is granted, and `updateCookieConsent(false)` after consent is revoked.

```js
const analytics = Analytics({
  app: 'awesome-app',
  plugins: [
    etrackerPlugin({
      secureCode: 'XXXXXX',
      blockCookies: true,
      cookieDomain: 'example.com',
    })
  ]
})

// Later... grant cookie consent from consent dialog
analytics.plugins.etracker.updateCookieConsent(true)
```

## Supported Platforms

The etracker plugin works in the browser. Node is currently not supported.

## License

MIT
