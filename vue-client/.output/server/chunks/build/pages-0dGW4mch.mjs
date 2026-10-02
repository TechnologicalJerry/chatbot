import { defineComponent, ref, mergeProps, unref, withCtx, createTextVNode, createVNode, computed, toDisplayString, withModifiers, openBlock, createBlock, createCommentVNode, withDirectives, vModelText, vModelSelect, watch, Fragment, renderList, nextTick, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderSlot, ssrRenderTeleport } from 'vue/server-renderer';

//#region app/composables/useServer.ts
var BACKEND_TARGETS = [
	{
		name: "Express.js",
		url: "http://localhost:3000",
		port: 3e3,
		badge: "Express 4.x"
	},
	{
		name: "Nest.js 12",
		url: "http://localhost:3001",
		port: 3001,
		badge: "Nest.js 12"
	},
	{
		name: "Fastify 5",
		url: "http://localhost:3002",
		port: 3002,
		badge: "Fastify 5"
	}
];
var activeServer = ref(BACKEND_TARGETS[0]);
var serverHealth = ref("checking");
var latencyMs = ref(null);
function useServer() {
	const setActiveServer = (target) => {
		activeServer.value = target;
		checkHealth();
	};
	const checkHealth = async () => {
		serverHealth.value = "checking";
		const start = performance.now();
		try {
			if ((await fetch(`${activeServer.value.url}/health/live`)).ok) {
				latencyMs.value = Math.round(performance.now() - start);
				serverHealth.value = "online";
			} else {
				serverHealth.value = "offline";
				latencyMs.value = null;
			}
		} catch {
			serverHealth.value = "offline";
			latencyMs.value = null;
		}
	};
	return {
		activeServer,
		serverHealth,
		latencyMs,
		setActiveServer,
		checkHealth,
		targets: BACKEND_TARGETS
	};
}
//#endregion
//#region app/composables/useAuth.ts
var user = ref(null);
var token = ref(null);
var isLoading$3 = ref(false);
function useAuth() {
	const { activeServer } = useServer();
	const apiFetch = async (endpoint, options = {}) => {
		const authToken = token.value || null;
		const headers = {
			"Content-Type": "application/json",
			...options.headers
		};
		if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
		const url = `${activeServer.value.url}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
		const res = await fetch(url, {
			...options,
			headers
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status} Error`);
		return data;
	};
	const login = async (email, pass) => {
		isLoading$3.value = true;
		try {
			const data = await apiFetch("/api/v1/sessions", {
				method: "POST",
				body: JSON.stringify({
					email,
					password: pass
				})
			});
			token.value = data.accessToken;
			user.value = data.user;
		} finally {
			isLoading$3.value = false;
		}
	};
	const register = async (email, pass, name, tier = "free") => {
		isLoading$3.value = true;
		try {
			await apiFetch("/api/v1/users/register", {
				method: "POST",
				body: JSON.stringify({
					email,
					password: pass,
					name,
					tier
				})
			});
			await login(email, pass);
		} finally {
			isLoading$3.value = false;
		}
	};
	const logout = async () => {
		if (token.value) await apiFetch("/api/v1/sessions/current", { method: "DELETE" }).catch(() => {});
		token.value = null;
		user.value = null;
	};
	return {
		user,
		token,
		isLoading: isLoading$3,
		apiFetch,
		login,
		register,
		logout
	};
}
//#endregion
//#region app/composables/useChat.ts
var conversations = ref([]);
var activeConversationId = ref(null);
var messages = ref([]);
var isLoading$2 = ref(false);
function useChat() {
	const { activeServer } = useServer();
	const { user, token, apiFetch } = useAuth();
	const fetchConversations = async () => {
		if (!user.value) {
			conversations.value = [];
			activeConversationId.value = null;
			messages.value = [];
			return;
		}
		try {
			const items = (await apiFetch("/api/v1/conversations")).items || [];
			conversations.value = items;
			if (items.length > 0 && !activeConversationId.value) selectConversation(items[0]._id);
		} catch {
			conversations.value = [];
		}
	};
	const selectConversation = async (conversationId) => {
		activeConversationId.value = conversationId;
		try {
			messages.value = (await apiFetch(`/api/v1/conversations/${conversationId}/messages`)).items || [];
		} catch {
			messages.value = [];
		}
	};
	const createConversation = async (title = "New Conversation") => {
		const newConv = await apiFetch("/api/v1/conversations", {
			method: "POST",
			body: JSON.stringify({ title })
		});
		conversations.value = [newConv, ...conversations.value];
		selectConversation(newConv._id);
		return newConv;
	};
	const deleteConversation = async (id) => {
		await apiFetch(`/api/v1/conversations/${id}`, { method: "DELETE" });
		conversations.value = conversations.value.filter((c) => c._id !== id);
		if (activeConversationId.value === id) {
			if (conversations.value.length > 0) selectConversation(conversations.value[0]._id);
			else {
				activeConversationId.value = null;
				messages.value = [];
			}
		}
	};
	const sendMessage = async (userText, model, useStreaming) => {
		let targetConvId = activeConversationId.value;
		if (!targetConvId) targetConvId = (await createConversation(userText.slice(0, 25)))._id;
		const tempUserMsg = {
			conversationId: targetConvId,
			role: "user",
			content: userText,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		messages.value.push(tempUserMsg);
		isLoading$2.value = true;
		if (useStreaming) {
			const tempAssistantMsg = {
				conversationId: targetConvId,
				role: "assistant",
				content: "",
				isStreaming: true,
				createdAt: (/* @__PURE__ */ new Date()).toISOString()
			};
			messages.value.push(tempAssistantMsg);
			const url = `${activeServer.value.url}/api/v1/chat/stream?conversationId=${encodeURIComponent(targetConvId)}&message=${encodeURIComponent(userText)}`;
			try {
				const response = await fetch(url, { headers: token.value ? { Authorization: `Bearer ${token.value}` } : {} });
				if (!response.ok) throw new Error("SSE stream error");
				const reader = response.body?.getReader();
				if (!reader) throw new Error("No reader");
				const decoder = new TextDecoder("utf-8");
				let buffer = "";
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() || "";
					let currentEvent = "message";
					for (const line of lines) {
						const trimmed = line.trim();
						if (!trimmed) continue;
						if (trimmed.startsWith("event:")) currentEvent = trimmed.replace("event:", "").trim();
						else if (trimmed.startsWith("data:")) {
							const rawData = trimmed.replace("data:", "").trim();
							try {
								const parsed = JSON.parse(rawData);
								if (currentEvent === "chunk" && parsed.content) {
									const last = messages.value[messages.value.length - 1];
									if (last && last.role === "assistant") last.content += parsed.content;
								} else if (currentEvent === "done") {
									const last = messages.value[messages.value.length - 1];
									if (last && last.role === "assistant") last.isStreaming = false;
								}
							} catch {
								if (currentEvent === "chunk") {
									const last = messages.value[messages.value.length - 1];
									if (last && last.role === "assistant") last.content += rawData;
								}
							}
						}
					}
				}
			} catch {
				selectConversation(targetConvId);
			} finally {
				isLoading$2.value = false;
			}
		} else try {
			const res = await apiFetch("/api/v1/chat", {
				method: "POST",
				body: JSON.stringify({
					conversationId: targetConvId,
					message: userText,
					model
				})
			});
			const assistantMsg = {
				conversationId: targetConvId,
				role: "assistant",
				content: res.content,
				createdAt: (/* @__PURE__ */ new Date()).toISOString()
			};
			messages.value.push(assistantMsg);
		} finally {
			isLoading$2.value = false;
		}
	};
	watch([activeServer, user], () => {
		fetchConversations();
	});
	return {
		conversations,
		activeConversationId,
		messages,
		isLoading: isLoading$2,
		fetchConversations,
		selectConversation,
		createConversation,
		deleteConversation,
		sendMessage
	};
}
//#endregion
//#region app/components/ui/BaseBadge.vue?vue&type=script&setup=true&lang.ts
var BaseBadge_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BaseBadge",
	__ssrInlineRender: true,
	props: {
		variant: { default: "cyan" },
		size: { default: "md" },
		customClass: { default: "" }
	},
	setup(__props) {
		const props = __props;
		const classes = computed(() => {
			return `inline-flex items-center gap-1 font-mono font-medium rounded-lg border backdrop-blur-md ${{
				cyan: "bg-cyan-950/80 text-cyan-300 border-cyan-500/30",
				indigo: "bg-indigo-950/80 text-indigo-300 border-indigo-500/30",
				emerald: "bg-emerald-950/80 text-emerald-300 border-emerald-500/30",
				rose: "bg-rose-950/80 text-rose-300 border-rose-500/30",
				amber: "bg-amber-950/80 text-amber-300 border-amber-500/30",
				slate: "bg-slate-800/80 text-slate-300 border-slate-700/50"
			}[props.variant]} ${{
				sm: "px-2 py-0.5 text-[10px]",
				md: "px-2.5 py-1 text-xs"
			}[props.size]} ${props.customClass}`;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<span${ssrRenderAttrs(mergeProps({ class: classes.value }, _attrs))}>`);
			ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</span>`);
		};
	}
});
//#endregion
//#region app/components/ui/BaseBadge.vue
var _sfc_setup$12 = BaseBadge_vue_vue_type_script_setup_true_lang_default.setup;
BaseBadge_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/BaseBadge.vue");
	return _sfc_setup$12 ? _sfc_setup$12(props, ctx) : void 0;
};
var BaseBadge_default = Object.assign(BaseBadge_vue_vue_type_script_setup_true_lang_default, { __name: "UiBaseBadge" });
//#endregion
//#region app/components/sidebar/ServerSelector.vue?vue&type=script&setup=true&lang.ts
var ServerSelector_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "ServerSelector",
	__ssrInlineRender: true,
	setup(__props) {
		const { activeServer, serverHealth, latencyMs, targets } = useServer();
		const getButtonClass = (port) => {
			return activeServer.value.port === port ? "px-2 py-1.5 rounded-lg text-xs font-mono transition-all text-center border bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-sm shadow-cyan-500/20 font-bold" : "px-2 py-1.5 rounded-lg text-xs font-mono transition-all text-center border bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200";
		};
		const getHealthDotClass = () => {
			const health = serverHealth.value;
			if (health === "online") return "w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse";
			if (health === "checking") return "w-2 h-2 rounded-full bg-amber-400";
			return "w-2 h-2 rounded-full bg-rose-500";
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2" }, _attrs))}><div class="flex items-center justify-between"><div class="flex items-center gap-1.5 text-xs font-semibold text-slate-300"><span>🖥️ Active Backend Target</span></div><button title="Re-check health" class="p-1 text-slate-400 hover:text-cyan-400 transition-colors text-xs"> 🔄 </button></div><div class="grid grid-cols-3 gap-1.5"><!--[-->`);
			ssrRenderList(unref(targets), (target) => {
				_push(`<button class="${ssrRenderClass(getButtonClass(target.port))}"> :${ssrInterpolate(target.port)} <div class="text-[9px] opacity-75">${ssrInterpolate(target.name.split(" ")[0])}</div></button>`);
			});
			_push(`<!--]--></div><div class="flex items-center justify-between text-[11px] pt-1"><div class="flex items-center gap-1.5"><span class="${ssrRenderClass(getHealthDotClass())}"></span><span class="text-slate-400 capitalize">${ssrInterpolate(unref(serverHealth))}</span></div>`);
			if (unref(latencyMs) !== null) _push(ssrRenderComponent(BaseBadge_default, {
				variant: "emerald",
				size: "sm"
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(` ⚡ ${ssrInterpolate(unref(latencyMs))}ms `);
					else return [createTextVNode(" ⚡ " + toDisplayString(unref(latencyMs)) + "ms ", 1)];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push(`</div></div>`);
		};
	}
});
//#endregion
//#region app/components/sidebar/ServerSelector.vue
var _sfc_setup$11 = ServerSelector_vue_vue_type_script_setup_true_lang_default.setup;
ServerSelector_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/sidebar/ServerSelector.vue");
	return _sfc_setup$11 ? _sfc_setup$11(props, ctx) : void 0;
};
var ServerSelector_default = Object.assign(ServerSelector_vue_vue_type_script_setup_true_lang_default, { __name: "SidebarServerSelector" });
//#endregion
//#region app/components/ui/BaseButton.vue?vue&type=script&setup=true&lang.ts
var BaseButton_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BaseButton",
	__ssrInlineRender: true,
	props: {
		type: { default: "button" },
		variant: { default: "primary" },
		size: { default: "md" },
		isLoading: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		customClass: { default: "" }
	},
	emits: ["click"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const classes = computed(() => {
			return `inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${{
				sm: "px-3 py-1.5 text-xs",
				md: "px-4 py-2 text-sm",
				lg: "px-6 py-3 text-base"
			}[props.size]} ${{
				primary: "bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/30",
				secondary: "bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 backdrop-blur-md",
				danger: "bg-rose-600/80 hover:bg-rose-500/80 text-white border border-rose-500/40 shadow-lg shadow-rose-500/20",
				ghost: "bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white"
			}[props.variant]} ${props.customClass}`;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<button${ssrRenderAttrs(mergeProps({
				type: props.type,
				disabled: props.disabled || props.isLoading,
				class: classes.value
			}, _attrs))}>`);
			if (props.isLoading) _push(`<span class="flex items-center gap-2"><svg class="w-4 h-4 animate-spin text-current" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Loading... </span>`);
			else ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</button>`);
		};
	}
});
//#endregion
//#region app/components/ui/BaseButton.vue
var _sfc_setup$10 = BaseButton_vue_vue_type_script_setup_true_lang_default.setup;
BaseButton_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/BaseButton.vue");
	return _sfc_setup$10 ? _sfc_setup$10(props, ctx) : void 0;
};
var BaseButton_default = Object.assign(BaseButton_vue_vue_type_script_setup_true_lang_default, { __name: "UiBaseButton" });
//#endregion
//#region app/components/sidebar/AppSidebar.vue?vue&type=script&setup=true&lang.ts
var AppSidebar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AppSidebar",
	__ssrInlineRender: true,
	emits: [
		"openKnowledge",
		"openMemory",
		"openAuth"
	],
	setup(__props, { emit: __emit }) {
		const emit = __emit;
		const { user} = useAuth();
		const { conversations, activeConversationId, createConversation} = useChat();
		const getConvItemClass = (id) => {
			return activeConversationId.value === id ? "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border bg-slate-800/80 border-cyan-500/40 text-cyan-300 font-medium shadow-sm" : "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200";
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<aside${ssrRenderAttrs(mergeProps({ class: "w-80 h-screen flex flex-col bg-slate-950/90 border-r border-slate-800/80 backdrop-blur-2xl" }, _attrs))}><div class="p-4 border-b border-slate-800/80"><div class="flex items-center gap-2.5 mb-3"><div class="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/20 text-white font-bold text-sm"> ✨ </div><div><h1 class="text-base font-bold text-white tracking-wide bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent"> AI Chatbot OS </h1><p class="text-[10px] text-slate-400 font-mono">Nuxt 4 Composition Architecture</p></div></div>`);
			_push(ssrRenderComponent(ServerSelector_default, null, null, _parent));
			_push(`</div><div class="p-3">`);
			_push(ssrRenderComponent(BaseButton_default, {
				"custom-class": "w-full justify-start gap-2 shadow-md",
				onClick: ($event) => unref(createConversation)()
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(` 💬 <span${_scopeId}>New Chat</span>`);
					else return [createTextVNode(" 💬 "), createVNode("span", null, "New Chat")];
				}),
				_: 1
			}, _parent));
			_push(`</div><div class="flex-1 overflow-y-auto px-3 space-y-1"><div class="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase"> History (${ssrInterpolate(unref(conversations).length)}) </div>`);
			if (unref(conversations).length === 0) _push(`<div class="px-3 py-6 text-center text-xs text-slate-500"> No active conversations yet. Start a new chat above! </div>`);
			else {
				_push(`<!--[-->`);
				ssrRenderList(unref(conversations), (conv) => {
					_push(`<div class="${ssrRenderClass(getConvItemClass(conv._id))}"><div class="flex items-center gap-2.5 truncate"><span class="text-xs">💬</span><span class="text-xs truncate">${ssrInterpolate(conv.title)}</span></div><button title="Delete thread" class="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity text-xs"> 🗑️ </button></div>`);
				});
				_push(`<!--]-->`);
			}
			_push(`</div><div class="p-3 border-t border-slate-800/80 space-y-1.5"><button class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-cyan-300 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all"> 📖 <span>Knowledge Base (RAG)</span></button><button class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-purple-300 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all"> 🧠 <span>Long-Term Memory</span></button></div><div class="p-3 border-t border-slate-800/80 bg-slate-950">`);
			if (unref(user)) _push(`<div class="flex items-center justify-between"><div class="truncate pr-2"><div class="text-xs font-medium text-slate-200 truncate">${ssrInterpolate(unref(user).name)}</div><div class="text-[10px] text-slate-400 truncate">${ssrInterpolate(unref(user).email)}</div></div><button title="Sign Out" class="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors text-xs"> 🚪 </button></div>`);
			else _push(ssrRenderComponent(BaseButton_default, {
				variant: "secondary",
				"custom-class": "w-full justify-center gap-2",
				onClick: ($event) => emit("openAuth")
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(` 🔑 <span${_scopeId}>Sign In / Register</span>`);
					else return [createTextVNode(" 🔑 "), createVNode("span", null, "Sign In / Register")];
				}),
				_: 1
			}, _parent));
			_push(`</div></aside>`);
		};
	}
});
//#endregion
//#region app/components/sidebar/AppSidebar.vue
var _sfc_setup$9 = AppSidebar_vue_vue_type_script_setup_true_lang_default.setup;
AppSidebar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/sidebar/AppSidebar.vue");
	return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
var AppSidebar_default = Object.assign(AppSidebar_vue_vue_type_script_setup_true_lang_default, { __name: "SidebarAppSidebar" });
//#endregion
//#region app/components/chat/PromptAlert.vue?vue&type=script&setup=true&lang.ts
var PromptAlert_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "PromptAlert",
	__ssrInlineRender: true,
	props: { patterns: {} },
	setup(__props) {
		const props = __props;
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "flex items-start gap-2.5 p-3 mb-2 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-300 text-xs" }, _attrs))}><span class="text-sm">🛡️</span><div><div class="font-semibold text-rose-200">Security Warning: Prompt Injection Pattern Flagged</div><p class="text-[11px] text-rose-400 mt-0.5"> This message triggered security scanner filters. Input has been sanitized before sending to LLM. </p>`);
			if (props.patterns && props.patterns.length > 0) _push(`<div class="mt-1 font-mono text-[10px] text-rose-400/80"> Matched Rules: ${ssrInterpolate(props.patterns.join(", "))}</div>`);
			else _push(`<!---->`);
			_push(`</div></div>`);
		};
	}
});
//#endregion
//#region app/components/chat/PromptAlert.vue
var _sfc_setup$8 = PromptAlert_vue_vue_type_script_setup_true_lang_default.setup;
PromptAlert_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chat/PromptAlert.vue");
	return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
var PromptAlert_default = Object.assign(PromptAlert_vue_vue_type_script_setup_true_lang_default, { __name: "ChatPromptAlert" });
//#endregion
//#region app/components/chat/MessageBubble.vue?vue&type=script&setup=true&lang.ts
var MessageBubble_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "MessageBubble",
	__ssrInlineRender: true,
	props: { message: {} },
	setup(__props) {
		const props = __props;
		const containerClass = computed(() => `flex gap-3 my-4 ${props.message.role === "user" ? "flex-row-reverse" : "flex-row"}`);
		const contentAlignClass = computed(() => `max-w-[80%] ${props.message.role === "user" ? "text-right" : "text-left"}`);
		const avatarClass = computed(() => {
			const isUser = props.message.role === "user";
			const isAssistant = props.message.role === "assistant";
			return `w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs ${isUser ? "bg-cyan-950 border-cyan-500/40 text-cyan-300" : isAssistant ? "bg-purple-950 border-purple-500/40 text-purple-300" : "bg-slate-800 border-slate-700 text-slate-300"}`;
		});
		const avatarIcon = computed(() => {
			if (props.message.role === "user") return "👤";
			if (props.message.role === "assistant") return "🤖";
			if (props.message.role === "tool") return "⚙️";
			return "💻";
		});
		const bubbleClass = computed(() => {
			return `p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap border ${props.message.role === "user" ? "bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 border-cyan-500/30 text-white rounded-tr-none shadow-md shadow-cyan-950/20" : "bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none shadow-md backdrop-blur-md"}`;
		});
		const toolName = computed(() => {
			const meta = props.message.metadata;
			return meta && meta.toolCall && meta.toolCall.name ? meta.toolCall.name : null;
		});
		const formatTime = (iso) => {
			if (!iso) return "";
			try {
				return new Date(iso).toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit"
				});
			} catch {
				return "";
			}
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${ssrRenderAttrs(mergeProps({ class: containerClass.value }, _attrs))}><div class="${ssrRenderClass(avatarClass.value)}">${ssrInterpolate(avatarIcon.value)}</div><div class="${ssrRenderClass(contentAlignClass.value)}"><div class="flex items-center gap-2 mb-1"><span class="text-[11px] font-semibold text-slate-400 capitalize">${ssrInterpolate(props.message.role)}</span>`);
			if (props.message.createdAt) _push(`<span class="text-[10px] text-slate-500 font-mono">${ssrInterpolate(formatTime(props.message.createdAt))}</span>`);
			else _push(`<!---->`);
			_push(`</div>`);
			if (props.message.metadata?.promptInjectionDetected) _push(ssrRenderComponent(PromptAlert_default, { patterns: props.message.metadata?.matchedPatterns }, null, _parent));
			else _push(`<!---->`);
			_push(`<div class="${ssrRenderClass(bubbleClass.value)}">${ssrInterpolate(props.message.content)} `);
			if (props.message.isStreaming) _push(`<span class="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse rounded-xs"></span>`);
			else _push(`<!---->`);
			_push(`</div>`);
			if (toolName.value) {
				_push(`<div class="mt-1.5 flex gap-1.5">`);
				_push(ssrRenderComponent(BaseBadge_default, {
					variant: "indigo",
					size: "sm"
				}, {
					default: withCtx((_, _push, _parent, _scopeId) => {
						if (_push) _push(` ⚙️ Tool: ${ssrInterpolate(toolName.value)}`);
						else return [createTextVNode(" ⚙️ Tool: " + toDisplayString(toolName.value), 1)];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</div></div>`);
		};
	}
});
//#endregion
//#region app/components/chat/MessageBubble.vue
var _sfc_setup$7 = MessageBubble_vue_vue_type_script_setup_true_lang_default.setup;
MessageBubble_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chat/MessageBubble.vue");
	return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
var MessageBubble_default = Object.assign(MessageBubble_vue_vue_type_script_setup_true_lang_default, { __name: "ChatMessageBubble" });
//#endregion
//#region app/components/chat/ChatInput.vue?vue&type=script&setup=true&lang.ts
var ChatInput_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "ChatInput",
	__ssrInlineRender: true,
	props: { disabled: { type: Boolean } },
	emits: ["send"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const text = ref("");
		const model = ref("gpt-4o-mini");
		const useStreaming = ref(true);
		const streamingBtnClass = computed(() => useStreaming.value ? "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all border bg-emerald-950/80 border-emerald-500/50 text-emerald-300" : "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all border bg-slate-900 border-slate-800 text-slate-400");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<form${ssrRenderAttrs(mergeProps({ class: "p-4 bg-slate-950/90 border-t border-slate-800/80" }, _attrs))}><div class="flex items-center justify-between gap-3 mb-2 px-1 text-xs"><div class="flex items-center gap-2"><span>⚡</span><select class="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none text-xs"><option value="gpt-4o-mini"${ssrIncludeBooleanAttr(Array.isArray(model.value) ? ssrLooseContain(model.value, "gpt-4o-mini") : ssrLooseEqual(model.value, "gpt-4o-mini")) ? " selected" : ""}>gpt-4o-mini (Fast)</option><option value="gpt-4o"${ssrIncludeBooleanAttr(Array.isArray(model.value) ? ssrLooseContain(model.value, "gpt-4o") : ssrLooseEqual(model.value, "gpt-4o")) ? " selected" : ""}>gpt-4o (High Intelligence)</option><option value="mock-engine"${ssrIncludeBooleanAttr(Array.isArray(model.value) ? ssrLooseContain(model.value, "mock-engine") : ssrLooseEqual(model.value, "mock-engine")) ? " selected" : ""}>Mock Engine (Offline)</option></select></div><button type="button" class="${ssrRenderClass(streamingBtnClass.value)}"><span>📡 SSE Stream: ${ssrInterpolate(useStreaming.value ? "ON" : "OFF")}</span></button></div><div class="relative flex items-center"><textarea rows="2"${ssrIncludeBooleanAttr(props.disabled) ? " disabled" : ""} placeholder="Ask anything... (Press Enter to send, Shift+Enter for new line)" class="w-full py-3 pl-4 pr-12 text-sm text-white bg-slate-900/90 border border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500/80 resize-none shadow-inner">${ssrInterpolate(text.value)}</textarea><button type="submit"${ssrIncludeBooleanAttr(props.disabled || !text.value.trim()) ? " disabled" : ""} class="absolute right-3 p-2 text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-cyan-500/20 text-xs"> 🚀 </button></div></form>`);
		};
	}
});
//#endregion
//#region app/components/chat/ChatInput.vue
var _sfc_setup$6 = ChatInput_vue_vue_type_script_setup_true_lang_default.setup;
ChatInput_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chat/ChatInput.vue");
	return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
var ChatInput_default = Object.assign(ChatInput_vue_vue_type_script_setup_true_lang_default, { __name: "ChatInput" });
//#endregion
//#region app/components/chat/ChatArea.vue?vue&type=script&setup=true&lang.ts
var ChatArea_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "ChatArea",
	__ssrInlineRender: true,
	setup(__props) {
		const { activeServer } = useServer();
		const { conversations, activeConversationId, messages, isLoading, sendMessage } = useChat();
		const scrollContainer = ref(null);
		const activeConversation = computed(() => {
			const id = activeConversationId.value;
			return conversations.value.find((c) => c._id === id) || null;
		});
		const handleSend = async (event) => {
			await sendMessage(event.message, event.model, event.useStreaming);
			nextTick(() => {
				if (scrollContainer.value) scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
			});
		};
		return (_ctx, _push, _parent, _attrs) => {
			if (!activeConversation.value) {
				_push(`<div${ssrRenderAttrs(mergeProps({ class: "flex-1 h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-center" }, _attrs))}><div class="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl mb-4"><span class="text-4xl animate-pulse">✨</span></div><h2 class="text-xl font-bold text-white mb-2">Welcome to AI Chatbot OS</h2><p class="text-sm text-slate-400 max-w-md mb-6"> Nuxt 4 Composition client connected seamlessly to Express, Nest.js, or Fastify backends with real-time SSE streaming. </p><div class="flex items-center gap-2">`);
				_push(ssrRenderComponent(BaseBadge_default, {
					variant: "cyan",
					size: "md"
				}, {
					default: withCtx((_, _push, _parent, _scopeId) => {
						if (_push) _push(` 🖥️ Active Target: ${ssrInterpolate(unref(activeServer).name)} (:${ssrInterpolate(unref(activeServer).port)}) `);
						else return [createTextVNode(" 🖥️ Active Target: " + toDisplayString(unref(activeServer).name) + " (:" + toDisplayString(unref(activeServer).port) + ") ", 1)];
					}),
					_: 1
				}, _parent));
				_push(`</div></div>`);
			} else {
				_push(`<div${ssrRenderAttrs(mergeProps({ class: "flex-1 h-screen flex flex-col bg-slate-950" }, _attrs))}><div class="px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl"><div class="flex items-center gap-2.5"><span class="text-sm">💬</span><h2 class="text-sm font-semibold text-white truncate max-w-xs">${ssrInterpolate(activeConversation.value.title)}</h2></div><div class="flex items-center gap-2">`);
				_push(ssrRenderComponent(BaseBadge_default, {
					variant: "cyan",
					size: "sm"
				}, {
					default: withCtx((_, _push, _parent, _scopeId) => {
						if (_push) _push(` 🖥️ ${ssrInterpolate(unref(activeServer).name)}`);
						else return [createTextVNode(" 🖥️ " + toDisplayString(unref(activeServer).name), 1)];
					}),
					_: 1
				}, _parent));
				_push(`</div></div><div class="flex-1 overflow-y-auto p-6 space-y-2">`);
				if (unref(messages).length === 0) _push(`<div class="h-full flex items-center justify-center text-xs text-slate-500"> No messages in this conversation yet. Type your query below! </div>`);
				else {
					_push(`<!--[-->`);
					ssrRenderList(unref(messages), (msg, index) => {
						_push(ssrRenderComponent(MessageBubble_default, {
							key: msg._id || index,
							message: msg
						}, null, _parent));
					});
					_push(`<!--]-->`);
				}
				_push(`</div>`);
				_push(ssrRenderComponent(ChatInput_default, {
					disabled: unref(isLoading),
					onSend: handleSend
				}, null, _parent));
				_push(`</div>`);
			}
		};
	}
});
//#endregion
//#region app/components/chat/ChatArea.vue
var _sfc_setup$5 = ChatArea_vue_vue_type_script_setup_true_lang_default.setup;
ChatArea_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chat/ChatArea.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var ChatArea_default = Object.assign(ChatArea_vue_vue_type_script_setup_true_lang_default, { __name: "ChatArea" });
//#endregion
//#region app/components/ui/BaseModal.vue?vue&type=script&setup=true&lang.ts
var BaseModal_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BaseModal",
	__ssrInlineRender: true,
	props: {
		isOpen: { type: Boolean },
		title: {}
	},
	emits: ["close"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		watch(() => props.isOpen, (val) => {});
		return (_ctx, _push, _parent, _attrs) => {
			ssrRenderTeleport(_push, (_push) => {
				if (props.isOpen) {
					_push(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"><div class="relative w-full max-w-2xl bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"><div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50"><h3 class="text-lg font-semibold text-white tracking-wide">${ssrInterpolate(props.title)}</h3><button class="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"> ✕ </button></div><div class="p-6 max-h-[80vh] overflow-y-auto">`);
					ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
					_push(`</div></div></div>`);
				} else _push(`<!---->`);
			}, "body", false, _parent);
		};
	}
});
//#endregion
//#region app/components/ui/BaseModal.vue
var _sfc_setup$4 = BaseModal_vue_vue_type_script_setup_true_lang_default.setup;
BaseModal_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/BaseModal.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var BaseModal_default = Object.assign(BaseModal_vue_vue_type_script_setup_true_lang_default, { __name: "UiBaseModal" });
//#endregion
//#region app/components/auth/AuthModal.vue?vue&type=script&setup=true&lang.ts
var AuthModal_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AuthModal",
	__ssrInlineRender: true,
	props: { isOpen: { type: Boolean } },
	emits: ["close"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { isLoading, login, register } = useAuth();
		const isRegisterMode = ref(false);
		const email = ref("");
		const password = ref("");
		const name = ref("");
		const tier = ref("free");
		const error = ref(null);
		const toggleMode = () => {
			isRegisterMode.value = !isRegisterMode.value;
			error.value = null;
		};
		const handleSubmit = async () => {
			error.value = null;
			try {
				if (isRegisterMode.value) await register(email.value, password.value, name.value, tier.value);
				else await login(email.value, password.value);
				emit("close");
			} catch (err) {
				error.value = err.message || "Authentication failed";
			}
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(ssrRenderComponent(BaseModal_default, mergeProps({
				"is-open": props.isOpen,
				title: isRegisterMode.value ? "Create Account" : "Sign In",
				onClose: ($event) => emit("close")
			}, _attrs), {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<form class="space-y-4"${_scopeId}>`);
						if (error.value) _push(`<div class="p-3 text-sm text-rose-300 bg-rose-950/80 border border-rose-800/80 rounded-xl"${_scopeId}>${ssrInterpolate(error.value)}</div>`);
						else _push(`<!---->`);
						if (isRegisterMode.value) _push(`<div${_scopeId}><label class="block mb-1.5 text-xs font-medium text-slate-300"${_scopeId}>Full Name</label><input${ssrRenderAttr("value", name.value)} type="text" required placeholder="John Doe" class="w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"${_scopeId}></div>`);
						else _push(`<!---->`);
						_push(`<div${_scopeId}><label class="block mb-1.5 text-xs font-medium text-slate-300"${_scopeId}>Email Address</label><input${ssrRenderAttr("value", email.value)} type="email" required placeholder="user@example.com" class="w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"${_scopeId}></div><div${_scopeId}><label class="block mb-1.5 text-xs font-medium text-slate-300"${_scopeId}>Password</label><input${ssrRenderAttr("value", password.value)} type="password" required minlength="6" placeholder="••••••••" class="w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"${_scopeId}></div>`);
						if (isRegisterMode.value) _push(`<div${_scopeId}><label class="block mb-1.5 text-xs font-medium text-slate-300"${_scopeId}>Quota Tier</label><select class="w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"${_scopeId}><option value="free"${ssrIncludeBooleanAttr(Array.isArray(tier.value) ? ssrLooseContain(tier.value, "free") : ssrLooseEqual(tier.value, "free")) ? " selected" : ""}${_scopeId}>Free (100 req/day)</option><option value="pro"${ssrIncludeBooleanAttr(Array.isArray(tier.value) ? ssrLooseContain(tier.value, "pro") : ssrLooseEqual(tier.value, "pro")) ? " selected" : ""}${_scopeId}>Pro (5,000 req/day)</option><option value="enterprise"${ssrIncludeBooleanAttr(Array.isArray(tier.value) ? ssrLooseContain(tier.value, "enterprise") : ssrLooseEqual(tier.value, "enterprise")) ? " selected" : ""}${_scopeId}>Enterprise (50,000 req/day)</option></select></div>`);
						else _push(`<!---->`);
						_push(`<div class="pt-2"${_scopeId}>`);
						_push(ssrRenderComponent(BaseButton_default, {
							type: "submit",
							"is-loading": unref(isLoading),
							"custom-class": "w-full py-3"
						}, {
							default: withCtx((_, _push, _parent, _scopeId) => {
								if (_push) _push(`${ssrInterpolate(isRegisterMode.value ? "Register" : "Sign In")}`);
								else return [createTextVNode(toDisplayString(isRegisterMode.value ? "Register" : "Sign In"), 1)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`</div><div class="text-center pt-2"${_scopeId}><button type="button" class="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"${_scopeId}>${ssrInterpolate(isRegisterMode.value ? "Already have an account? Sign In" : "Don't have an account? Register")}</button></div></form>`);
					} else return [createVNode("form", {
						class: "space-y-4",
						onSubmit: withModifiers(handleSubmit, ["prevent"])
					}, [
						error.value ? (openBlock(), createBlock("div", {
							key: 0,
							class: "p-3 text-sm text-rose-300 bg-rose-950/80 border border-rose-800/80 rounded-xl"
						}, toDisplayString(error.value), 1)) : createCommentVNode("", true),
						isRegisterMode.value ? (openBlock(), createBlock("div", { key: 1 }, [createVNode("label", { class: "block mb-1.5 text-xs font-medium text-slate-300" }, "Full Name"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => name.value = $event,
							type: "text",
							required: "",
							placeholder: "John Doe",
							class: "w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, name.value]])])) : createCommentVNode("", true),
						createVNode("div", null, [createVNode("label", { class: "block mb-1.5 text-xs font-medium text-slate-300" }, "Email Address"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => email.value = $event,
							type: "email",
							required: "",
							placeholder: "user@example.com",
							class: "w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, email.value]])]),
						createVNode("div", null, [createVNode("label", { class: "block mb-1.5 text-xs font-medium text-slate-300" }, "Password"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => password.value = $event,
							type: "password",
							required: "",
							minlength: "6",
							placeholder: "••••••••",
							class: "w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, password.value]])]),
						isRegisterMode.value ? (openBlock(), createBlock("div", { key: 2 }, [createVNode("label", { class: "block mb-1.5 text-xs font-medium text-slate-300" }, "Quota Tier"), withDirectives(createVNode("select", {
							"onUpdate:modelValue": ($event) => tier.value = $event,
							class: "w-full px-3 py-2.5 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
						}, [
							createVNode("option", { value: "free" }, "Free (100 req/day)"),
							createVNode("option", { value: "pro" }, "Pro (5,000 req/day)"),
							createVNode("option", { value: "enterprise" }, "Enterprise (50,000 req/day)")
						], 8, ["onUpdate:modelValue"]), [[vModelSelect, tier.value]])])) : createCommentVNode("", true),
						createVNode("div", { class: "pt-2" }, [createVNode(BaseButton_default, {
							type: "submit",
							"is-loading": unref(isLoading),
							"custom-class": "w-full py-3"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(isRegisterMode.value ? "Register" : "Sign In"), 1)]),
							_: 1
						}, 8, ["is-loading"])]),
						createVNode("div", { class: "text-center pt-2" }, [createVNode("button", {
							type: "button",
							class: "text-xs text-cyan-400 hover:text-cyan-300 hover:underline",
							onClick: toggleMode
						}, toDisplayString(isRegisterMode.value ? "Already have an account? Sign In" : "Don't have an account? Register"), 1)])
					], 32)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region app/components/auth/AuthModal.vue
var _sfc_setup$3 = AuthModal_vue_vue_type_script_setup_true_lang_default.setup;
AuthModal_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/auth/AuthModal.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var AuthModal_default = Object.assign(AuthModal_vue_vue_type_script_setup_true_lang_default, { __name: "AuthModal" });
//#endregion
//#region app/composables/useKnowledge.ts
var documents = ref([]);
var searchResults = ref([]);
var isLoading$1 = ref(false);
function useKnowledge() {
	const { apiFetch } = useAuth();
	const fetchDocuments = async () => {
		try {
			documents.value = await apiFetch("/api/v1/knowledge") || [];
		} catch {
			documents.value = [];
		}
	};
	const uploadDocument = async (title, content) => {
		isLoading$1.value = true;
		try {
			await apiFetch("/api/v1/knowledge", {
				method: "POST",
				body: JSON.stringify({
					title,
					content
				})
			});
			await fetchDocuments();
		} finally {
			isLoading$1.value = false;
		}
	};
	const searchVector = async (query) => {
		isLoading$1.value = true;
		try {
			searchResults.value = await apiFetch(`/api/v1/knowledge/search?q=${encodeURIComponent(query)}`) || [];
		} catch {
			searchResults.value = [];
		} finally {
			isLoading$1.value = false;
		}
	};
	const deleteDocument = async (id) => {
		await apiFetch(`/api/v1/knowledge/${id}`, { method: "DELETE" });
		await fetchDocuments();
	};
	return {
		documents,
		searchResults,
		isLoading: isLoading$1,
		fetchDocuments,
		uploadDocument,
		searchVector,
		deleteDocument
	};
}
//#endregion
//#region app/components/panels/KnowledgeModal.vue?vue&type=script&setup=true&lang.ts
var KnowledgeModal_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "KnowledgeModal",
	__ssrInlineRender: true,
	props: { isOpen: { type: Boolean } },
	emits: ["close"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { documents, searchResults, isLoading, fetchDocuments, uploadDocument, searchVector, deleteDocument } = useKnowledge();
		const title = ref("");
		const content = ref("");
		const searchQuery = ref("");
		watch(() => props.isOpen, (val) => {
			if (val) fetchDocuments();
		});
		const handleUpload = async () => {
			if (!title.value || !content.value) return;
			await uploadDocument(title.value, content.value);
			title.value = "";
			content.value = "";
		};
		const handleSearch = async () => {
			if (!searchQuery.value) return;
			await searchVector(searchQuery.value);
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(ssrRenderComponent(BaseModal_default, mergeProps({
				"is-open": props.isOpen,
				title: "RAG Knowledge Base Manager",
				onClose: ($event) => emit("close")
			}, _attrs), {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="space-y-6"${_scopeId}><form class="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3"${_scopeId}><div class="flex items-center gap-2 text-sm font-semibold text-cyan-300"${_scopeId}> ☁️ <span${_scopeId}>Ingest New Document</span></div><input${ssrRenderAttr("value", title.value)} type="text" required placeholder="Document Title (e.g. Refund Policy v2.pdf)" class="w-full px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"${_scopeId}><textarea required rows="3" placeholder="Paste document text content here..." class="w-full px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"${_scopeId}>${ssrInterpolate(content.value)}</textarea>`);
						_push(ssrRenderComponent(BaseButton_default, {
							type: "submit",
							"is-loading": unref(isLoading),
							size: "sm",
							"custom-class": "w-full"
						}, {
							default: withCtx((_, _push, _parent, _scopeId) => {
								if (_push) _push(` Process &amp; Compute Embeddings `);
								else return [createTextVNode(" Process & Compute Embeddings ")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`</form><form class="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3"${_scopeId}><div class="flex items-center gap-2 text-sm font-semibold text-purple-300"${_scopeId}> 🔍 <span${_scopeId}>Vector Similarity Search Tester</span></div><div class="flex gap-2"${_scopeId}><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Enter search query..." class="flex-1 px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500"${_scopeId}>`);
						_push(ssrRenderComponent(BaseButton_default, {
							type: "submit",
							"is-loading": unref(isLoading),
							size: "sm",
							variant: "secondary"
						}, {
							default: withCtx((_, _push, _parent, _scopeId) => {
								if (_push) _push(` Search `);
								else return [createTextVNode(" Search ")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`</div>`);
						if (unref(searchResults).length > 0) {
							_push(`<div class="space-y-2 pt-2"${_scopeId}><div class="text-[11px] font-semibold text-slate-400"${_scopeId}>Top Matches:</div><!--[-->`);
							ssrRenderList(unref(searchResults), (result) => {
								_push(`<div class="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1"${_scopeId}><div class="flex justify-between items-center"${_scopeId}>`);
								_push(ssrRenderComponent(BaseBadge_default, { variant: "emerald" }, {
									default: withCtx((_, _push, _parent, _scopeId) => {
										if (_push) _push(`Score: ${ssrInterpolate((result.score * 100).toFixed(1))}%`);
										else return [createTextVNode("Score: " + toDisplayString((result.score * 100).toFixed(1)) + "%", 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`</div><p class="text-slate-300 text-[11px] font-mono"${_scopeId}>${ssrInterpolate(result.content)}</p></div>`);
							});
							_push(`<!--]--></div>`);
						} else _push(`<!---->`);
						_push(`</form><div${_scopeId}><h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"${_scopeId}> Ingested Documents (${ssrInterpolate(unref(documents).length)}) </h4><div class="space-y-2 max-h-48 overflow-y-auto"${_scopeId}>`);
						if (unref(documents).length === 0) _push(`<div class="text-xs text-slate-500 py-4 text-center"${_scopeId}> No documents in knowledge base. </div>`);
						else {
							_push(`<!--[-->`);
							ssrRenderList(unref(documents), (doc) => {
								_push(`<div class="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl"${_scopeId}><div class="flex items-center gap-2.5 truncate"${_scopeId}><span class="text-sm"${_scopeId}>📄</span><div${_scopeId}><div class="text-xs font-medium text-slate-200 truncate"${_scopeId}>${ssrInterpolate(doc.title)}</div><div class="text-[10px] text-slate-500"${_scopeId}>${ssrInterpolate(doc.chunkCount)} Vector Chunks</div></div></div><button class="p-1.5 text-slate-500 hover:text-rose-400 transition-colors text-xs"${_scopeId}> 🗑️ </button></div>`);
							});
							_push(`<!--]-->`);
						}
						_push(`</div></div></div>`);
					} else return [createVNode("div", { class: "space-y-6" }, [
						createVNode("form", {
							class: "p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3",
							onSubmit: withModifiers(handleUpload, ["prevent"])
						}, [
							createVNode("div", { class: "flex items-center gap-2 text-sm font-semibold text-cyan-300" }, [createTextVNode(" ☁️ "), createVNode("span", null, "Ingest New Document")]),
							withDirectives(createVNode("input", {
								"onUpdate:modelValue": ($event) => title.value = $event,
								type: "text",
								required: "",
								placeholder: "Document Title (e.g. Refund Policy v2.pdf)",
								class: "w-full px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"
							}, null, 8, ["onUpdate:modelValue"]), [[vModelText, title.value]]),
							withDirectives(createVNode("textarea", {
								"onUpdate:modelValue": ($event) => content.value = $event,
								required: "",
								rows: "3",
								placeholder: "Paste document text content here...",
								class: "w-full px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"
							}, null, 8, ["onUpdate:modelValue"]), [[vModelText, content.value]]),
							createVNode(BaseButton_default, {
								type: "submit",
								"is-loading": unref(isLoading),
								size: "sm",
								"custom-class": "w-full"
							}, {
								default: withCtx(() => [createTextVNode(" Process & Compute Embeddings ")]),
								_: 1
							}, 8, ["is-loading"])
						], 32),
						createVNode("form", {
							class: "p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3",
							onSubmit: withModifiers(handleSearch, ["prevent"])
						}, [
							createVNode("div", { class: "flex items-center gap-2 text-sm font-semibold text-purple-300" }, [createTextVNode(" 🔍 "), createVNode("span", null, "Vector Similarity Search Tester")]),
							createVNode("div", { class: "flex gap-2" }, [withDirectives(createVNode("input", {
								"onUpdate:modelValue": ($event) => searchQuery.value = $event,
								type: "text",
								placeholder: "Enter search query...",
								class: "flex-1 px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500"
							}, null, 8, ["onUpdate:modelValue"]), [[vModelText, searchQuery.value]]), createVNode(BaseButton_default, {
								type: "submit",
								"is-loading": unref(isLoading),
								size: "sm",
								variant: "secondary"
							}, {
								default: withCtx(() => [createTextVNode(" Search ")]),
								_: 1
							}, 8, ["is-loading"])]),
							unref(searchResults).length > 0 ? (openBlock(), createBlock("div", {
								key: 0,
								class: "space-y-2 pt-2"
							}, [createVNode("div", { class: "text-[11px] font-semibold text-slate-400" }, "Top Matches:"), (openBlock(true), createBlock(Fragment, null, renderList(unref(searchResults), (result) => {
								return openBlock(), createBlock("div", {
									key: result.chunkId,
									class: "p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1"
								}, [createVNode("div", { class: "flex justify-between items-center" }, [createVNode(BaseBadge_default, { variant: "emerald" }, {
									default: withCtx(() => [createTextVNode("Score: " + toDisplayString((result.score * 100).toFixed(1)) + "%", 1)]),
									_: 2
								}, 1024)]), createVNode("p", { class: "text-slate-300 text-[11px] font-mono" }, toDisplayString(result.content), 1)]);
							}), 128))])) : createCommentVNode("", true)
						], 32),
						createVNode("div", null, [createVNode("h4", { class: "text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" }, " Ingested Documents (" + toDisplayString(unref(documents).length) + ") ", 1), createVNode("div", { class: "space-y-2 max-h-48 overflow-y-auto" }, [unref(documents).length === 0 ? (openBlock(), createBlock("div", {
							key: 0,
							class: "text-xs text-slate-500 py-4 text-center"
						}, " No documents in knowledge base. ")) : (openBlock(true), createBlock(Fragment, { key: 1 }, renderList(unref(documents), (doc) => {
							return openBlock(), createBlock("div", {
								key: doc._id,
								class: "flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl"
							}, [createVNode("div", { class: "flex items-center gap-2.5 truncate" }, [createVNode("span", { class: "text-sm" }, "📄"), createVNode("div", null, [createVNode("div", { class: "text-xs font-medium text-slate-200 truncate" }, toDisplayString(doc.title), 1), createVNode("div", { class: "text-[10px] text-slate-500" }, toDisplayString(doc.chunkCount) + " Vector Chunks", 1)])]), createVNode("button", {
								class: "p-1.5 text-slate-500 hover:text-rose-400 transition-colors text-xs",
								onClick: ($event) => unref(deleteDocument)(doc._id)
							}, " 🗑️ ", 8, ["onClick"])]);
						}), 128))])])
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region app/components/panels/KnowledgeModal.vue
var _sfc_setup$2 = KnowledgeModal_vue_vue_type_script_setup_true_lang_default.setup;
KnowledgeModal_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/panels/KnowledgeModal.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var KnowledgeModal_default = Object.assign(KnowledgeModal_vue_vue_type_script_setup_true_lang_default, { __name: "PanelsKnowledgeModal" });
//#endregion
//#region app/composables/useMemory.ts
var memories = ref([]);
var isLoading = ref(false);
function useMemory() {
	const { apiFetch } = useAuth();
	const fetchMemories = async () => {
		try {
			memories.value = await apiFetch("/api/v1/memory") || [];
		} catch {
			memories.value = [];
		}
	};
	const addMemory = async (fact) => {
		isLoading.value = true;
		try {
			await apiFetch("/api/v1/memory", {
				method: "POST",
				body: JSON.stringify({ fact })
			});
			await fetchMemories();
		} finally {
			isLoading.value = false;
		}
	};
	const deleteMemory = async (id) => {
		await apiFetch(`/api/v1/memory/${id}`, { method: "DELETE" });
		await fetchMemories();
	};
	return {
		memories,
		isLoading,
		fetchMemories,
		addMemory,
		deleteMemory
	};
}
//#endregion
//#region app/components/panels/MemoryDrawer.vue?vue&type=script&setup=true&lang.ts
var MemoryDrawer_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "MemoryDrawer",
	__ssrInlineRender: true,
	props: { isOpen: { type: Boolean } },
	emits: ["close"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { memories, isLoading, fetchMemories, addMemory, deleteMemory } = useMemory();
		const fact = ref("");
		watch(() => props.isOpen, (val) => {
			if (val) fetchMemories();
		});
		const handleAdd = async () => {
			if (!fact.value) return;
			await addMemory(fact.value);
			fact.value = "";
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(ssrRenderComponent(BaseModal_default, mergeProps({
				"is-open": props.isOpen,
				title: "Long-Term User Memory",
				onClose: ($event) => emit("close")
			}, _attrs), {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="space-y-6"${_scopeId}><form class="flex gap-2"${_scopeId}><input${ssrRenderAttr("value", fact.value)} type="text" required placeholder="Add memory fact (e.g. User prefers TypeScript over JS)" class="flex-1 px-3 py-2 text-xs text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-purple-500"${_scopeId}>`);
						_push(ssrRenderComponent(BaseButton_default, {
							type: "submit",
							"is-loading": unref(isLoading),
							size: "sm"
						}, {
							default: withCtx((_, _push, _parent, _scopeId) => {
								if (_push) _push(` ➕ Save Fact `);
								else return [createTextVNode(" ➕ Save Fact ")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`</form><div class="space-y-2"${_scopeId}><h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider"${_scopeId}> Stored Memories (${ssrInterpolate(unref(memories).length)}) </h4>`);
						if (unref(memories).length === 0) _push(`<div class="p-6 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800 rounded-xl"${_scopeId}> No memory facts stored yet. The AI automatically extracts facts during conversation or you can add them manually above. </div>`);
						else {
							_push(`<!--[-->`);
							ssrRenderList(unref(memories), (mem) => {
								_push(`<div class="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl"${_scopeId}><div class="flex items-center gap-2.5"${_scopeId}><span class="text-sm"${_scopeId}>🧠</span><div${_scopeId}><div class="text-xs font-medium text-slate-200"${_scopeId}>${ssrInterpolate(mem.fact)}</div><div class="flex items-center gap-2 mt-1"${_scopeId}>`);
								_push(ssrRenderComponent(BaseBadge_default, {
									variant: mem.source === "extracted" ? "indigo" : "emerald",
									size: "sm"
								}, {
									default: withCtx((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${ssrInterpolate(mem.source)}`);
										else return [createTextVNode(toDisplayString(mem.source), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`<span class="text-[10px] text-slate-500"${_scopeId}> Confidence: ${ssrInterpolate((mem.confidence * 100).toFixed(0))}% </span></div></div></div><button class="p-1.5 text-slate-500 hover:text-rose-400 transition-colors text-xs"${_scopeId}> 🗑️ </button></div>`);
							});
							_push(`<!--]-->`);
						}
						_push(`</div></div>`);
					} else return [createVNode("div", { class: "space-y-6" }, [createVNode("form", {
						class: "flex gap-2",
						onSubmit: withModifiers(handleAdd, ["prevent"])
					}, [withDirectives(createVNode("input", {
						"onUpdate:modelValue": ($event) => fact.value = $event,
						type: "text",
						required: "",
						placeholder: "Add memory fact (e.g. User prefers TypeScript over JS)",
						class: "flex-1 px-3 py-2 text-xs text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-purple-500"
					}, null, 8, ["onUpdate:modelValue"]), [[vModelText, fact.value]]), createVNode(BaseButton_default, {
						type: "submit",
						"is-loading": unref(isLoading),
						size: "sm"
					}, {
						default: withCtx(() => [createTextVNode(" ➕ Save Fact ")]),
						_: 1
					}, 8, ["is-loading"])], 32), createVNode("div", { class: "space-y-2" }, [createVNode("h4", { class: "text-xs font-semibold text-slate-400 uppercase tracking-wider" }, " Stored Memories (" + toDisplayString(unref(memories).length) + ") ", 1), unref(memories).length === 0 ? (openBlock(), createBlock("div", {
						key: 0,
						class: "p-6 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800 rounded-xl"
					}, " No memory facts stored yet. The AI automatically extracts facts during conversation or you can add them manually above. ")) : (openBlock(true), createBlock(Fragment, { key: 1 }, renderList(unref(memories), (mem) => {
						return openBlock(), createBlock("div", {
							key: mem._id,
							class: "flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl"
						}, [createVNode("div", { class: "flex items-center gap-2.5" }, [createVNode("span", { class: "text-sm" }, "🧠"), createVNode("div", null, [createVNode("div", { class: "text-xs font-medium text-slate-200" }, toDisplayString(mem.fact), 1), createVNode("div", { class: "flex items-center gap-2 mt-1" }, [createVNode(BaseBadge_default, {
							variant: mem.source === "extracted" ? "indigo" : "emerald",
							size: "sm"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(mem.source), 1)]),
							_: 2
						}, 1032, ["variant"]), createVNode("span", { class: "text-[10px] text-slate-500" }, " Confidence: " + toDisplayString((mem.confidence * 100).toFixed(0)) + "% ", 1)])])]), createVNode("button", {
							class: "p-1.5 text-slate-500 hover:text-rose-400 transition-colors text-xs",
							onClick: ($event) => unref(deleteMemory)(mem._id)
						}, " 🗑️ ", 8, ["onClick"])]);
					}), 128))])])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region app/components/panels/MemoryDrawer.vue
var _sfc_setup$1 = MemoryDrawer_vue_vue_type_script_setup_true_lang_default.setup;
MemoryDrawer_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/panels/MemoryDrawer.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var MemoryDrawer_default = Object.assign(MemoryDrawer_vue_vue_type_script_setup_true_lang_default, { __name: "PanelsMemoryDrawer" });
//#endregion
//#region app/pages/index.vue?vue&type=script&setup=true&lang.ts
var index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "index",
	__ssrInlineRender: true,
	setup(__props) {
		const isAuthOpen = ref(false);
		const isKnowledgeOpen = ref(false);
		const isMemoryOpen = ref(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-screen w-screen overflow-hidden bg-slate-950" }, _attrs))}>`);
			_push(ssrRenderComponent(AppSidebar_default, {
				onOpenKnowledge: ($event) => isKnowledgeOpen.value = true,
				onOpenMemory: ($event) => isMemoryOpen.value = true,
				onOpenAuth: ($event) => isAuthOpen.value = true
			}, null, _parent));
			_push(ssrRenderComponent(ChatArea_default, null, null, _parent));
			_push(ssrRenderComponent(AuthModal_default, {
				"is-open": isAuthOpen.value,
				onClose: ($event) => isAuthOpen.value = false
			}, null, _parent));
			_push(ssrRenderComponent(KnowledgeModal_default, {
				"is-open": isKnowledgeOpen.value,
				onClose: ($event) => isKnowledgeOpen.value = false
			}, null, _parent));
			_push(ssrRenderComponent(MemoryDrawer_default, {
				"is-open": isMemoryOpen.value,
				onClose: ($event) => isMemoryOpen.value = false
			}, null, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region app/pages/index.vue
var _sfc_setup = index_vue_vue_type_script_setup_true_lang_default.setup;
index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var pages_default = index_vue_vue_type_script_setup_true_lang_default;

export { pages_default as default };
//# sourceMappingURL=pages-0dGW4mch.mjs.map
