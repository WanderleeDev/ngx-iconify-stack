# Changelog

## [1.2.1](https://github.com/WanderleeDev/ngx-iconify-stack/compare/v1.2.0...v1.2.1) (2026-08-02)

# [1.2.0](https://github.com/WanderleeDev/ngx-iconify-stack/compare/v1.1.2...v1.2.0) (2026-08-02)


### Bug Fixes

* **schematics:** correct icon-subset import path and version in generated skill ([31a5053](https://github.com/WanderleeDev/ngx-iconify-stack/commit/31a50531ad80b1817828a019ea2563c4a381f4ed))


### Features

* **schematics:** wire ngx-iconify-stack:skill script into package.json ([5f41c12](https://github.com/WanderleeDev/ngx-iconify-stack/commit/5f41c12d7ecc0eeeaf17f4a703867cf620276fb9))

# [1.1.2](https://github.com/WanderleeDev/ngx-iconify-stack/compare/v1.1.1...v1.1.2) (2026-08-01)

### Docs

* add 3D floating animation to hero icon with perspective effect
* add "How It Works" section explaining SSR, subsetting, and smart fallback
* add "View Icon Sets" button to Interactive Sandbox (Iconify search link)
* enhance footer branding: "Built by WanderleeDev" with direct link
* add favicon (webp) and use in navbar and across site
* improve landing page layout and spacing

# [1.1.1](https://github.com/WanderleeDev/ngx-iconify-stack/compare/v1.1.0...v1.1.1) (2026-08-01)

### Docs

* add ngx-iconify-stack banner to README and npm
* add Open Graph and Twitter Card meta tags for link previews
* remove deprecation notice for versions < 1.0.0
* add npm keywords for better discoverability

# [1.1.0](https://github.com/WanderleeDev/ngx-iconify-stack/compare/v1.0.0...v1.1.0) (2026-08-01)


### Bug Fixes

* remove deprecated field from v1.0.0 package.json ([1fcf834](https://github.com/WanderleeDev/ngx-iconify-stack/commit/1fcf8348407ac69008d88709900f0d505501dba0))

# [1.0.0](https://github.com/WanderleeDev/ngx-iconify-stack/compare/v0.1.3...v1.0.0) (2026-08-01)


### Bug Fixes

* **icon:** handle iconify-icon load failure gracefully ([cf90a52](https://github.com/WanderleeDev/ngx-iconify-stack/commit/cf90a525b0c064d93433171d62bbd01b068f0c62))


### Features

* **api:** restrict flip/rotate out of the public API ([e547430](https://github.com/WanderleeDev/ngx-iconify-stack/commit/e547430fecab0c54e4c28c42db9bee42796130b3))

## ⚠️ Deprecation Notice

**All versions < 1.0.0 are deprecated.** Users are encouraged to upgrade to v1.0.0 or later. No breaking changes in the public API; migration is straightforward.

---

## [0.1.3](https://github.com/WanderleeDev/ngx-iconify-stack/compare/v0.1.2...v0.1.3) (2026-08-01)


### Bug Fixes

* **pkg:** drop out-of-root assets from ng-package.json ([399ce57](https://github.com/WanderleeDev/ngx-iconify-stack/commit/399ce57cd5a5f730a1769ff00b63e70ea0f16aaf))

## [0.1.2](https://github.com/WanderleeDev/ngx-iconify-stack/compare/v0.1.1...v0.1.2) (2026-07-31)


### Bug Fixes

* **ci:** create Cloudflare Pages project on first deploy ([e11c5d2](https://github.com/WanderleeDev/ngx-iconify-stack/commit/e11c5d2d9584796db00cd1e1d662e86a40791d52))
* **ci:** drop unnecessary gitHubToken from Pages deploy ([c9dfcbe](https://github.com/WanderleeDev/ngx-iconify-stack/commit/c9dfcbe0a910048b258f6286415b522c854db29d)), closes [#6200f5](https://github.com/WanderleeDev/ngx-iconify-stack/issues/6200f5)

## [0.1.1](https://github.com/WanderleeDev/ngx-iconify-stack/compare/v0.1.0...v0.1.1) (2026-07-31)


### Bug Fixes

* **ci:** use gitHubToken input for cloudflare pages action ([91f1579](https://github.com/WanderleeDev/ngx-iconify-stack/commit/91f157911d127200f8cba251dc762377edb86aa4))
* **pkg:** use compact >=20 <23 peer dep range ([1da1710](https://github.com/WanderleeDev/ngx-iconify-stack/commit/1da171033a64813338d493b7c7a5393a0b3441c7))
* **pkg:** widen Angular peer deps to ^20 || ^21 || ^22 range ([fd14ad5](https://github.com/WanderleeDev/ngx-iconify-stack/commit/fd14ad5d96599620eace56599eaf01bf35a35663))


### Features

* **schematics:** ng-add wires ngx-iconify-stack:generate-icons script and prebuild ([0dc3271](https://github.com/WanderleeDev/ngx-iconify-stack/commit/0dc3271e1ee0d795c7a465b21753685d63f49bc4))

# 0.1.0 (2026-07-31)


### Bug Fixes

* add @iconify/types as optional peer dep of ngx-iconify-stack ([a117906](https://github.com/WanderleeDev/ngx-iconify-stack/commit/a1179069adb869072ec4ee5561798260a05bffbd))


### Features

* **docs:** change rotation to slider and add reset button to sandbox ([86ab87c](https://github.com/WanderleeDev/ngx-iconify-stack/commit/86ab87cc00035b7a385608adab2d0f804c1a2ca1))
* **docs:** initialize documentation application ([168af62](https://github.com/WanderleeDev/ngx-iconify-stack/commit/168af62a0eaf7a69034324e7fa439fef0d685fcd))
* hide floating icons on small screens and refactor hero section layout formatting ([1b6f9a2](https://github.com/WanderleeDev/ngx-iconify-stack/commit/1b6f9a22e7703aba8de6c3ee3eb1cff71588ade9))
* hybrid SSR rendering — inline SVG on server, web component on client ([9ab0e90](https://github.com/WanderleeDev/ngx-iconify-stack/commit/9ab0e9009aabe52bf613153cdb2266958ac12d0f))
* implement generate-icon-subset schematic with build-time icon subsetting ([c8a205b](https://github.com/WanderleeDev/ngx-iconify-stack/commit/c8a205bae56818db37bf06f809706fbd055b828b))
* **lib:** initialize library and workspace configuration ([7f367ed](https://github.com/WanderleeDev/ngx-iconify-stack/commit/7f367ed6aa147e270c1e34392e7f6fb0f83b230f))
* migrate ngx-icon-stack to provideIconify pattern with SSR-safe lazy loading ([f5d369a](https://github.com/WanderleeDev/ngx-iconify-stack/commit/f5d369a09935825e79a72ba380c56ac7d388575d))
* **ngx-iconify:** support Angular 20+ with OnPush change detection ([1fe4491](https://github.com/WanderleeDev/ngx-iconify-stack/commit/1fe44915a56378cab5e76a406fe33135b5871936))
* rename ngx-icon-stack to ngx-iconify-stack ([54c5471](https://github.com/WanderleeDev/ngx-iconify-stack/commit/54c547186f14f2ec71bda1c27016652556f6383e))
* **schematics:** add skill schematic and ng-add prompt to install it ([a37e57e](https://github.com/WanderleeDev/ngx-iconify-stack/commit/a37e57e3f6480534f931a3f1d277e420a44c9fa6))
* **schematics:** build icon subset with alias resolution and specs ([02f8ce2](https://github.com/WanderleeDev/ngx-iconify-stack/commit/02f8ce20a2a924414ee58ccf1dfcba3293e06190))
* **schematics:** execute scan/subset inline in the factory with integration specs ([8a7be28](https://github.com/WanderleeDev/ngx-iconify-stack/commit/8a7be28071af2a351806b7f570989848ea9cdd5a))
* **schematics:** inline icon scan with pinned regex and unit specs ([d14d705](https://github.com/WanderleeDev/ngx-iconify-stack/commit/d14d70579ed4ba077c98a0473a65d4b055cc6b9a))
* **schematics:** migrate legacy script, auto-install sets, wire icons script ([dbbe7ac](https://github.com/WanderleeDev/ngx-iconify-stack/commit/dbbe7acefb84dd61991619893d58fe04cc0dbd26))
