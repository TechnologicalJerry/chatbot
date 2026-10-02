import { u as useNuxtApp, a as useAppConfig, b as useRuntimeConfig, c as useHead$1, d as appDiagnostics, s as sanitizeTag, e as asyncDataDefaults, p as prodReporters, f as docsBase, g as createError$1 } from '../virtual/entry.mjs';
import { defineProdDiagnostics } from 'nostics';
import { defineComponent, computed, h, onServerPrefetch, createElementBlock, shallowRef, getCurrentInstance, provide, cloneVNode, isRef, toValue, ref, nextTick, unref, toRef, queuePostFlushCb } from 'vue';
import { z as hash } from '../_/nitro.mjs';
import { Icon, getIcon, loadIcon, addIcon } from '@iconify/vue';
import { getIconCSS } from '@iconify/utils/lib/css/icon';
import 'nostics/formatters/ansi';
import 'unhead/utils';
import '../routes/renderer.mjs';
import 'unhead/server';
import 'unhead/legacy';
import 'unhead/plugins';
import 'vue-bundle-renderer/runtime';
import 'vue/server-renderer';
import 'devalue';
import 'vue-router';
import 'tailwindcss/colors';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@iconify/utils';
import 'consola';

//#region virtual:nuxt:node_modules%2F.cache%2Fnuxt%2F.nuxt%2Fnuxt-icon-client-bundle.mjs
var _initialized = false;
function init(addIcon) {
	if (_initialized) return;
	const collections = JSON.parse("[{\"prefix\":\"lucide\",\"icons\":{\"arrow-down\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M12 5v14m7-7l-7 7l-7-7\\\"/>\"},\"arrow-left\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"m12 19l-7-7l7-7m7 7H5\\\"/>\"},\"arrow-right\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M5 12h14m-7-7l7 7l-7 7\\\"/>\"},\"arrow-up\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"m5 12l7-7l7 7m-7 7V5\\\"/>\"},\"arrow-up-right\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M7 7h10v10M7 17L17 7\\\"/>\"},\"check\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M20 6L9 17l-5-5\\\"/>\"},\"chevron-down\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"m6 9l6 6l6-6\\\"/>\"},\"chevron-left\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"m15 18l-6-6l6-6\\\"/>\"},\"chevron-right\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"m9 18l6-6l-6-6\\\"/>\"},\"chevron-up\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"m18 15l-6-6l-6 6\\\"/>\"},\"chevrons-left\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"m11 17l-5-5l5-5m7 10l-5-5l5-5\\\"/>\"},\"chevrons-right\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"m6 17l5-5l-5-5m7 10l5-5l-5-5\\\"/>\"},\"circle-alert\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"10\\\"/><path d=\\\"M12 8v4m0 4h.01\\\"/></g>\"},\"circle-check\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"10\\\"/><path d=\\\"m16 9l-5.5 5.5L8 12\\\"/></g>\"},\"circle-x\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"10\\\"/><path d=\\\"m15 9l-6 6m0-6l6 6\\\"/></g>\"},\"copy\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><rect width=\\\"14\\\" height=\\\"14\\\" x=\\\"8\\\" y=\\\"8\\\" rx=\\\"2\\\" ry=\\\"2\\\"/><path d=\\\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\\\"/></g>\"},\"copy-check\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><path d=\\\"m12 15l2 2l4-4\\\"/><rect width=\\\"14\\\" height=\\\"14\\\" x=\\\"8\\\" y=\\\"8\\\" rx=\\\"2\\\" ry=\\\"2\\\"/><path d=\\\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\\\"/></g>\"},\"ellipsis\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"1\\\"/><circle cx=\\\"19\\\" cy=\\\"12\\\" r=\\\"1\\\"/><circle cx=\\\"5\\\" cy=\\\"12\\\" r=\\\"1\\\"/></g>\"},\"eye\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><path d=\\\"M2.062 12.348a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 19.876 0a1 1 0 0 1 0 .696a10.75 10.75 0 0 1-19.876 0\\\"/><circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"3\\\"/></g>\"},\"eye-off\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><path d=\\\"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575a1 1 0 0 1 0 .696a10.8 10.8 0 0 1-1.444 2.49m-6.41-.679a3 3 0 0 1-4.242-4.242\\\"/><path d=\\\"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 4.446-5.143M2 2l20 20\\\"/></g>\"},\"file\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><path d=\\\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\\\"/><path d=\\\"M14 2v5a1 1 0 0 0 1 1h5\\\"/></g>\"},\"folder\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z\\\"/>\"},\"folder-open\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"m6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2\\\"/>\"},\"grip-vertical\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><circle cx=\\\"9\\\" cy=\\\"12\\\" r=\\\"1\\\"/><circle cx=\\\"9\\\" cy=\\\"5\\\" r=\\\"1\\\"/><circle cx=\\\"9\\\" cy=\\\"19\\\" r=\\\"1\\\"/><circle cx=\\\"15\\\" cy=\\\"12\\\" r=\\\"1\\\"/><circle cx=\\\"15\\\" cy=\\\"5\\\" r=\\\"1\\\"/><circle cx=\\\"15\\\" cy=\\\"19\\\" r=\\\"1\\\"/></g>\"},\"hash\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M4 9h16M4 15h16M10 3L8 21m8-18l-2 18\\\"/>\"},\"info\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"10\\\"/><path d=\\\"M12 16v-4m0-4h.01\\\"/></g>\"},\"lightbulb\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M15 14c.2-1 .7-1.7 1.5-2.5c1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5c.7.7 1.3 1.5 1.5 2.5m0 4h6m-5 4h4\\\"/>\"},\"loader-circle\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M21 12a9 9 0 1 1-6.219-8.56\\\"/>\"},\"menu\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M4 5h16M4 12h16M4 19h16\\\"/>\"},\"minus\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M5 12h14\\\"/>\"},\"monitor\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><rect width=\\\"20\\\" height=\\\"14\\\" x=\\\"2\\\" y=\\\"3\\\" rx=\\\"2\\\"/><path d=\\\"M8 21h8m-4-4v4\\\"/></g>\"},\"moon\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\\\"/>\"},\"panel-left-close\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><rect width=\\\"18\\\" height=\\\"18\\\" x=\\\"3\\\" y=\\\"3\\\" rx=\\\"2\\\"/><path d=\\\"M9 3v18m7-6l-3-3l3-3\\\"/></g>\"},\"panel-left-open\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><rect width=\\\"18\\\" height=\\\"18\\\" x=\\\"3\\\" y=\\\"3\\\" rx=\\\"2\\\"/><path d=\\\"M9 3v18m5-12l3 3l-3 3\\\"/></g>\"},\"plus\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M5 12h14m-7-7v14\\\"/>\"},\"rotate-ccw\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><path d=\\\"M3 12a9 9 0 1 0 9-9a9.75 9.75 0 0 0-6.74 2.74L3 8\\\"/><path d=\\\"M3 3v5h5\\\"/></g>\"},\"search\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><path d=\\\"m21 21l-4.34-4.34\\\"/><circle cx=\\\"11\\\" cy=\\\"11\\\" r=\\\"8\\\"/></g>\"},\"square\":{\"width\":24,\"height\":24,\"body\":\"<rect width=\\\"18\\\" height=\\\"18\\\" x=\\\"3\\\" y=\\\"3\\\" fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" rx=\\\"2\\\"/>\"},\"star\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z\\\"/>\"},\"sun\":{\"width\":24,\"height\":24,\"body\":\"<g fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\"><circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"4\\\"/><path d=\\\"M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\\\"/></g>\"},\"triangle-alert\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01\\\"/>\"},\"upload\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M12 3v12m5-7l-5-5l-5 5m14 7v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\\\"/>\"},\"x\":{\"width\":24,\"height\":24,\"body\":\"<path fill=\\\"none\\\" stroke=\\\"currentColor\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\" stroke-width=\\\"2\\\" d=\\\"M18 6L6 18M6 6l12 12\\\"/>\"}}}]");
	for (const collection of collections) for (const [name, data] of Object.entries(collection.icons)) addIcon(collection.prefix ? collection.prefix + ":" + name : name, data);
	_initialized = true;
}
//#endregion
//#region node_modules/@nuxt/icon/dist/runtime/components/shared.js
async function loadIcon$1(name, timeout) {
	if (!name) return null;
	init(addIcon);
	const _icon = getIcon(name);
	if (_icon) return _icon;
	let timeoutWarn;
	const load = loadIcon(name).catch(() => {
		console.warn(`[Icon] failed to load icon \`${name}\``);
		return null;
	});
	if (timeout > 0) await Promise.race([load, new Promise((resolve) => {
		timeoutWarn = setTimeout(() => {
			console.warn(`[Icon] loading icon \`${name}\` timed out after ${timeout}ms`);
			resolve();
		}, timeout);
	})]).finally(() => clearTimeout(timeoutWarn));
	else await load;
	return getIcon(name);
}
function useResolvedName(getName) {
	const options = useAppConfig().icon;
	const collections = (options.collections || []).sort((a, b) => b.length - a.length);
	return computed(() => {
		const name = getName();
		const bare = name.startsWith(options.cssSelectorPrefix) ? name.slice(options.cssSelectorPrefix.length) : name;
		const resolved = options.aliases?.[bare] || bare;
		if (!resolved.includes(":")) {
			const collection = collections.find((c) => resolved.startsWith(c + "-"));
			return collection ? collection + ":" + resolved.slice(collection.length + 1) : resolved;
		}
		return resolved;
	});
}
function resolveCustomizeFn(customize, globalCustomize) {
	if (customize === false) return void 0;
	if (customize === true || customize === null) return globalCustomize;
	return customize;
}
//#endregion
//#region node_modules/@nuxt/icon/dist/runtime/components/css.js
var SYMBOL_SERVER_CSS = "NUXT_ICONS_SERVER_CSS";
function escapeCssSelector(selector) {
	return selector.replace(/([^\w-])/g, "\\$1");
}
var NuxtIconCss = /* @__PURE__ */ defineComponent({
	name: "NuxtIconCss",
	props: {
		name: {
			type: String,
			required: true
		},
		customize: {
			type: [
				Function,
				Boolean,
				null
			],
			default: null,
			required: false
		}
	},
	setup(props) {
		const nuxt = useNuxtApp();
		const options = useAppConfig().icon;
		const cssClass = computed(() => {
			if (!props.name) return "";
			const base = options.cssSelectorPrefix + props.name;
			if (typeof props.customize === "function") return base + "--customized-" + hash(props.customize.toString());
			return base;
		});
		const selector = computed(() => "." + escapeCssSelector(cssClass.value));
		function getCSS(icon, withLayer = true) {
			let iconSelector = selector.value;
			if (options.cssWherePseudo) iconSelector = `:where(${iconSelector})`;
			const css = getIconCSS(icon, {
				iconSelector,
				format: "compressed",
				customise: resolveCustomizeFn(props.customize, options.customize)
			});
			if (options.cssLayer && withLayer) return `@layer ${options.cssLayer} { ${css} }`;
			return css;
		}
		onServerPrefetch(async () => {
			if (!(useRuntimeConfig().icon || {})?.serverKnownCssClasses?.includes(cssClass.value)) {
				const icon = await loadIcon$1(props.name, options.fetchTimeout).catch(() => null);
				if (!icon) return null;
				let ssrCSS = nuxt.vueApp._context.provides[SYMBOL_SERVER_CSS];
				if (!ssrCSS) {
					ssrCSS = nuxt.vueApp._context.provides[SYMBOL_SERVER_CSS] = /* @__PURE__ */ new Map();
					nuxt.runWithContext(() => {
						useHead$1({ style: [() => {
							const sep = "";
							let css = Array.from(ssrCSS.values()).sort().join(sep);
							if (options.cssLayer) css = `@layer ${options.cssLayer} {${sep}${css}${sep}}`;
							return { innerHTML: css };
						}] }, { tagPriority: "low" });
					});
				}
				if (cssClass.value && !ssrCSS.has(cssClass.value)) {
					const css = getCSS(icon, false);
					ssrCSS.set(cssClass.value, css);
				}
				return null;
			}
		});
		return () => h("span", { class: ["iconify", cssClass.value] });
	}
});
//#endregion
//#region node_modules/nuxt/dist/app/utils/debounce-tick.js
/**
* Debounce an async function so that repeated calls within the same tick are
* collapsed into a single call (plus a trailing call if arguments arrived
* while the debounced call was still pending).
*
* Adapted from https://github.com/unjs/perfect-debounce with the timeout
* replaced by Vue's post-flush callback queue.
*/
function debounceTick(fn, options = {}) {
	let leadingValue;
	let active = false;
	let resolveList = [];
	let currentPromise;
	let trailingArgs;
	const applyFn = (_this, args) => {
		const promise = _applyPromised(fn, _this, args);
		currentPromise = promise;
		promise.finally(() => {
			currentPromise = void 0;
			if (trailingArgs && !active) {
				const args = trailingArgs;
				trailingArgs = void 0;
				applyFn(_this, args);
			}
		});
		return promise;
	};
	return function(...args) {
		trailingArgs = args;
		if (currentPromise) return currentPromise;
		return new Promise((resolve) => {
			const shouldCallNow = options.leading && !active;
			if (!active) {
				active = true;
				queuePostFlushCb(() => {
					active = false;
					const flushArgs = trailingArgs ?? args;
					trailingArgs = void 0;
					const promise = options.leading ? leadingValue : applyFn(this, flushArgs);
					for (const _resolve of resolveList) _resolve(promise);
					resolveList = [];
				});
			}
			if (shouldCallNow) {
				leadingValue = applyFn(this, args);
				resolve(leadingValue);
			} else resolveList.push(resolve);
		});
	};
}
async function _applyPromised(fn, _this, args) {
	return await fn.apply(_this, args);
}
defineComponent({
	name: "ServerPlaceholder",
	render() {
		return createElementBlock("div");
	}
});
//#endregion
//#region node_modules/nuxt/dist/app/components/client-only.js
var clientOnlySymbol = Symbol.for("nuxt:client-only");
defineComponent({
	name: "ClientOnly",
	inheritAttrs: false,
	props: [
		"fallback",
		"placeholder",
		"placeholderTag",
		"fallbackTag"
	],
	setup(props, { slots, attrs }) {
		const mounted = shallowRef(false);
		const vm = getCurrentInstance();
		if (vm) vm._nuxtClientOnly = true;
		provide(clientOnlySymbol, true);
		return () => {
			if (mounted.value) {
				const vnodes = slots.default?.();
				if (vnodes && vnodes.length === 1) return [cloneVNode(vnodes[0], attrs)];
				return vnodes;
			}
			const slot = slots.fallback || slots.placeholder;
			if (slot) return h(slot);
			const fallbackStr = props.fallback || props.placeholder || "";
			const fallbackTag = sanitizeTag(props.fallbackTag || props.placeholderTag, "span");
			return createElementBlock(fallbackTag, attrs, fallbackStr);
		};
	}
});
//#endregion
//#region node_modules/nuxt/dist/compiler/runtime/index.js
/**
* Define a factory for a function that should be registered for automatic key injection.
* @since 4.2.0
* @param factory
*/
function defineKeyedFunctionFactory(factory) {
	const placeholder = function() {
		throw appDiagnostics.NUXT_E1007({ name: factory.name });
	};
	return Object.defineProperty(placeholder, "__nuxt_factory", {
		enumerable: false,
		get: () => factory.factory
	});
}
//#endregion
//#region node_modules/nuxt/dist/app/diagnostics/data.js
/**
* E3xxx
* Data fetching (useFetch / useAsyncData) runtime diagnostics.
*/
var dataDiagnostics = /* #__PURE__ */ defineProdDiagnostics({
	docsBase,
	reporters: prodReporters
});
//#endregion
//#region node_modules/nuxt/dist/app/composables/asyncData.js
var createUseAsyncData = defineKeyedFunctionFactory({
	name: "createUseAsyncData",
	factory(options = {}) {
		function useAsyncData(...args) {
			const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
			if (_isAutoKeyNeeded(args[0], args[1])) args.unshift(autoKey);
			let [_key, _handler, opts = {}] = args;
			const key = isRef(_key) || typeof _key === "function" ? computed(() => toValue(_key)) : { value: _key };
			if (!key.value || typeof key.value !== "string") throw dataDiagnostics.NUXT_E3008();
			if (typeof _handler !== "function") throw dataDiagnostics.NUXT_E3009();
			const shouldFactoryOptionsOverride = typeof options === "function";
			const nuxtApp = useNuxtApp();
			const factoryOptions = shouldFactoryOptionsOverride ? options(opts) : options;
			if (!shouldFactoryOptionsOverride) for (const key in factoryOptions) {
				if (factoryOptions[key] === void 0) continue;
				if (opts[key] !== void 0) continue;
				opts[key] = factoryOptions[key];
			}
			opts.server ??= true;
			opts.default ??= getDefault;
			opts.getCachedData ??= getDefaultCachedData;
			opts.lazy ??= false;
			opts.immediate ??= true;
			opts.deep ??= asyncDataDefaults.deep;
			opts.dedupe ??= "cancel";
			opts.enabled ??= true;
			if (shouldFactoryOptionsOverride) for (const key in factoryOptions) {
				if (factoryOptions[key] === void 0) continue;
				opts[key] = factoryOptions[key];
			}
			nuxtApp._asyncData[key.value];
			function createInitialFetch() {
				const initialFetchOptions = {
					cause: "initial",
					dedupe: opts.dedupe
				};
				const existing = nuxtApp._asyncData[key.value];
				if (!existing?._init) {
					initialFetchOptions.cachedData = opts.getCachedData(key.value, nuxtApp, { cause: "initial" });
					nuxtApp._asyncData[key.value] = buildAsyncData(nuxtApp, key.value, _handler, opts, initialFetchOptions.cachedData);
					nuxtApp._asyncData[key.value]._initialCachedData = initialFetchOptions.cachedData;
				} else if (nuxtApp._asyncDataPromises[key.value]) initialFetchOptions.cachedData = existing._initialCachedData;
				return () => nuxtApp._asyncData[key.value].execute(initialFetchOptions);
			}
			const initialFetch = createInitialFetch();
			const asyncData = nuxtApp._asyncData[key.value];
			asyncData._deps++;
			if (opts.server !== false && nuxtApp.payload.serverRendered && opts.immediate) {
				const promise = initialFetch();
				if (getCurrentInstance()) onServerPrefetch(() => promise);
				else nuxtApp.hook("app:created", async () => {
					await promise;
				});
			}
			const asyncReturn = {
				data: writableComputedRef(() => nuxtApp._asyncData[key.value]?.data),
				pending: writableComputedRef(() => nuxtApp._asyncData[key.value]?.pending),
				status: writableComputedRef(() => nuxtApp._asyncData[key.value]?.status),
				error: writableComputedRef(() => nuxtApp._asyncData[key.value]?.error),
				refresh: (...args) => {
					if (!nuxtApp._asyncData[key.value]?._init) return createInitialFetch()();
					return nuxtApp._asyncData[key.value].execute(...args);
				},
				execute: (...args) => asyncReturn.refresh(...args),
				clear: () => {
					const entry = nuxtApp._asyncData[key.value];
					if (entry?._abortController) try {
						entry._abortController.abort(new DOMException("AsyncData aborted by user.", "AbortError"));
					} finally {
						entry._abortController = void 0;
					}
					clearNuxtDataByKey(nuxtApp, key.value);
				}
			};
			const asyncDataPromise = Promise.resolve(nuxtApp._asyncDataPromises[key.value]).then(() => asyncReturn);
			Object.assign(asyncDataPromise, asyncReturn);
			Object.defineProperties(asyncDataPromise, {
				then: {
					enumerable: true,
					value: asyncDataPromise.then.bind(asyncDataPromise)
				},
				catch: {
					enumerable: true,
					value: asyncDataPromise.catch.bind(asyncDataPromise)
				},
				finally: {
					enumerable: true,
					value: asyncDataPromise.finally.bind(asyncDataPromise)
				}
			});
			return asyncDataPromise;
		}
		return useAsyncData;
	}
});
var useAsyncData = createUseAsyncData.__nuxt_factory();
createUseAsyncData.__nuxt_factory({
	lazy: true,
	_functionName: "useLazyAsyncData"
});
function writableComputedRef(getter) {
	return computed({
		get() {
			return getter()?.value;
		},
		set(value) {
			const ref = getter();
			if (ref) ref.value = value;
		}
	});
}
function _isAutoKeyNeeded(keyOrFetcher, fetcher) {
	if (typeof keyOrFetcher === "string") return false;
	if (typeof keyOrFetcher === "object" && keyOrFetcher !== null) return false;
	if (typeof keyOrFetcher === "function" && typeof fetcher === "function") return false;
	return true;
}
function clearNuxtDataByKey(nuxtApp, key) {
	delete nuxtApp.payload.data[key];
	delete nuxtApp.payload._errors[key];
	if (nuxtApp._asyncData[key]) {
		nuxtApp._asyncData[key].data.value = unref(nuxtApp._asyncData[key]._default());
		nuxtApp._asyncData[key].error.value = void 0;
		nuxtApp._asyncData[key].status.value = "idle";
		nuxtApp._asyncData[key]._initialCachedData = void 0;
	}
	delete nuxtApp._asyncDataPromises[key];
}
function pick(obj, keys) {
	const newObj = {};
	for (const key of keys) newObj[key] = obj[key];
	return newObj;
}
function buildAsyncData(nuxtApp, key, _handler, options, initialCachedData) {
	nuxtApp.payload._errors[key] ??= void 0;
	const hasCustomGetCachedData = options.getCachedData !== getDefaultCachedData;
	const handler = _handler ;
	const _ref = options.deep ? ref : shallowRef;
	const hasCachedData = initialCachedData !== void 0;
	const unsubRefreshAsyncData = nuxtApp.hook("app:data:refresh", async (keys) => {
		if (!keys || keys.includes(key)) await asyncData.execute({ cause: "refresh:hook" });
	});
	const asyncData = {
		data: _ref(hasCachedData ? initialCachedData : options.default()),
		pending: computed(() => asyncData.status.value === "pending"),
		error: toRef(nuxtApp.payload._errors, key),
		status: shallowRef("idle"),
		execute: (...args) => {
			const [_opts, newValue = void 0] = args;
			const opts = _opts && newValue === void 0 && typeof _opts === "object" ? _opts : {};
			if (nuxtApp._asyncDataPromises[key]) {
				if ((opts.dedupe ?? options.dedupe) === "defer") return nuxtApp._asyncDataPromises[key];
			}
			{
				const cachedData = "cachedData" in opts ? opts.cachedData : options.getCachedData(key, nuxtApp, { cause: opts.cause ?? "refresh:manual" });
				if (cachedData !== void 0) {
					nuxtApp.payload.data[key] = asyncData.data.value = cachedData;
					asyncData.error.value = void 0;
					asyncData.status.value = "success";
					return Promise.resolve(cachedData);
				}
			}
			if (toValue(options.enabled) === false) return Promise.resolve(asyncData.data.value);
			if (asyncData._abortController) asyncData._abortController.abort(new DOMException("AsyncData request cancelled by deduplication", "AbortError"));
			asyncData._abortController = new AbortController();
			asyncData.status.value = "pending";
			const cleanupController = new AbortController();
			const promise = new Promise((resolve, reject) => {
				try {
					const timeout = opts.timeout ?? options.timeout;
					const mergedSignal = mergeAbortSignals([asyncData._abortController?.signal, opts?.signal], cleanupController.signal, timeout);
					if (mergedSignal.aborted) {
						const reason = mergedSignal.reason;
						reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
						return;
					}
					mergedSignal.addEventListener("abort", () => {
						const reason = mergedSignal.reason;
						reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
					}, {
						once: true,
						signal: cleanupController.signal
					});
					return Promise.resolve(handler(nuxtApp, { signal: mergedSignal })).then(resolve, reject);
				} catch (err) {
					reject(err);
				}
			}).then(async (_result) => {
				if (nuxtApp._asyncDataPromises[key] !== promise) return;
				let result = _result;
				if (options.transform) result = await options.transform(_result);
				if (options.pick) result = pick(result, options.pick);
				nuxtApp.payload.data[key] = result;
				asyncData.data.value = result;
				asyncData.error.value = void 0;
				asyncData.status.value = "success";
			}).catch((error) => {
				if (nuxtApp._asyncDataPromises[key] !== promise) return nuxtApp._asyncDataPromises[key];
				if (asyncData._abortController?.signal.aborted) return nuxtApp._asyncDataPromises[key];
				if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
					asyncData.status.value = "idle";
					return nuxtApp._asyncDataPromises[key];
				}
				asyncData.error.value = createError$1(error);
				asyncData.data.value = unref(options.default());
				asyncData.status.value = "error";
			}).finally(() => {
				cleanupController.abort();
				if (nuxtApp._asyncDataPromises[key] === promise) delete nuxtApp._asyncDataPromises[key];
			});
			nuxtApp._asyncDataPromises[key] = promise;
			return nuxtApp._asyncDataPromises[key];
		},
		_execute: debounceTick((...args) => asyncData.execute(...args)),
		_default: options.default,
		_deps: 0,
		_init: true,
		_hash: void 0,
		_off: () => {
			unsubRefreshAsyncData();
			if (nuxtApp._asyncData[key]?._init) nuxtApp._asyncData[key]._init = false;
			if (nuxtApp._asyncDataPromises[key]) {
				asyncData._abortController?.abort(new DOMException("AsyncData request cancelled by unmount", "AbortError"));
				delete nuxtApp._asyncDataPromises[key];
				if (asyncData.status.value === "pending") asyncData.status.value = "idle";
			}
			if (!hasCustomGetCachedData) nextTick(() => {
				if (!nuxtApp._asyncData[key]?._init) {
					clearNuxtDataByKey(nuxtApp, key);
					asyncData.execute = () => Promise.resolve();
				}
			});
		}
	};
	return asyncData;
}
var getDefault = () => void 0;
var getDefaultCachedData = (key, nuxtApp, ctx) => {
	if (nuxtApp.isHydrating) return nuxtApp.payload.data[key];
	if (ctx.cause !== "refresh:manual" && ctx.cause !== "refresh:hook") return nuxtApp.static.data[key];
};
function mergeAbortSignals(signals, cleanupSignal, timeout) {
	const list = signals.filter((s) => !!s);
	if (typeof timeout === "number" && timeout >= 0) {
		const timeoutSignal = AbortSignal.timeout?.(timeout);
		if (timeoutSignal) list.push(timeoutSignal);
	}
	if (AbortSignal.any) return AbortSignal.any(list);
	const controller = new AbortController();
	for (const sig of list) if (sig.aborted) {
		const reason = sig.reason ?? new DOMException("Aborted", "AbortError");
		try {
			controller.abort(reason);
		} catch {
			controller.abort();
		}
		return controller.signal;
	}
	const onAbort = () => {
		const reason = list.find((s) => s.aborted)?.reason ?? new DOMException("Aborted", "AbortError");
		try {
			controller.abort(reason);
		} catch {
			controller.abort();
		}
	};
	for (const sig of list) sig.addEventListener?.("abort", onAbort, {
		once: true,
		signal: cleanupSignal
	});
	return controller.signal;
}
//#endregion
//#region node_modules/@nuxt/icon/dist/runtime/components/svg.js
var NuxtIconSvg = /* @__PURE__ */ defineComponent({
	name: "NuxtIconSvg",
	props: {
		name: {
			type: String,
			required: true
		},
		customize: {
			type: [
				Function,
				Boolean,
				null
			],
			default: null,
			required: false
		}
	},
	setup(props, { slots }) {
		useNuxtApp();
		const options = useAppConfig().icon;
		const name = useResolvedName(() => props.name);
		const storeKey = "i-" + name.value;
		if (name.value) onServerPrefetch(async () => {
			await useAsyncData(storeKey, async () => await loadIcon$1(name.value, options.fetchTimeout), { deep: false });
		});
		return () => h(Icon, {
			icon: name.value,
			ssr: true,
			customise: resolveCustomizeFn(props.customize, options.customize)
		}, slots);
	}
});
//#endregion
//#region node_modules/@nuxt/icon/dist/runtime/components/index.js
var components_default = defineComponent({
	name: "NuxtIcon",
	props: {
		name: {
			type: String,
			required: true
		},
		mode: {
			type: String,
			required: false,
			default: null
		},
		size: {
			type: [Number, String],
			required: false,
			default: null
		},
		customize: {
			type: [
				Function,
				Boolean,
				null
			],
			default: null,
			required: false
		}
	},
	setup(props, { slots }) {
		const nuxtApp = useNuxtApp();
		const runtimeOptions = useAppConfig().icon;
		const name = useResolvedName(() => props.name);
		const component = computed(() => nuxtApp.vueApp?.component(name.value) || ((props.mode || runtimeOptions.mode) === "svg" ? NuxtIconSvg : NuxtIconCss));
		const style = computed(() => {
			const size = props.size || runtimeOptions.size;
			return size ? { fontSize: Number.isNaN(+size) ? size : size + "px" } : null;
		});
		return () => h(component.value, {
			...runtimeOptions.attrs,
			name: name.value,
			class: runtimeOptions.class,
			style: style.value,
			customize: props.customize
		}, slots);
	}
});

export { components_default as default };
//# sourceMappingURL=components-DNKbk9XH.mjs.map
