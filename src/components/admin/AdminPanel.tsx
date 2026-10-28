"use client";

import { useCallback, useEffect, useReducer } from "react";
import { DocEditor } from "@/components/admin/DocEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { FileText, LogOut, Plus, ScrollText } from "lucide-react";

type Kind = "blog" | "legal";
type FileEntry = { kind: Kind; path: string };

/** Un documento abierto. Agrupado en un solo objeto porque se abre de una sola pieza. */
type Doc = {
	path: string;
	sha: string;
	savedRaw: string;
	historyUrl?: string;
	images: string[];
};

/** Borrador local: el texto sin guardar y el momento en que se escribió. */
type Draft = { raw: string; at: number };

const GROUPS: { kind: Kind; label: string; icon: typeof FileText }[] = [
	{ kind: "blog", label: "Blog", icon: FileText },
	{ kind: "legal", label: "Legal", icon: ScrollText },
];

const LOGIN_ERROR = "Could not sign in";

class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

async function request(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
	const response = await fetch(url, init);
	const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
	if (!response.ok) throw new ApiError(response.status, (data.error as string) || "Network error");
	return data;
}

function scaffold(slug: string): string {
	return `---
title: "${slug.replace(/-/g, " ")}"
date: "${new Date().toISOString().slice(0, 10)}"
excerpt: ""
tags: []
author: "William Salas"
---

`;
}

// Los borradores viven en el navegador y no en R2: guardar publica el cambio al
// instante, pero autoguardar cada frase no aporta nada. `ponytail:` localStorage,
// sin servidor; si algún día se edita desde dos equipos, el borrador deja de
// alcanzar.
const draftKey = (path: string) => `admin-draft:${path}`;

function readDraft(path: string, serverRaw: string): Draft | null {
	try {
		const stored = localStorage.getItem(draftKey(path));
		if (!stored) return null;
		const draft = JSON.parse(stored) as { raw?: unknown; at?: unknown };
		if (typeof draft.raw !== "string" || draft.raw === serverRaw) return null;
		return { raw: draft.raw, at: typeof draft.at === "number" ? draft.at : Date.now() };
	} catch {
		return null;
	}
}

function dropDraft(path: string): void {
	try {
		localStorage.removeItem(draftKey(path));
	} catch {
		// Modo privado o cuota llena: el borrador es una comodidad, no un requisito.
	}
}

function fileLabel(path: string): string {
	return path.split("/").pop()?.replace(/\.md$/, "") ?? path;
}

/**
 * Estado del panel en un solo objeto: sesión, archivo abierto, edición y
 * borrador. Abrir un documento toca cinco piezas a la vez (doc, raw, savedAt,
 * borrador y estado de guardado) y con `useState` separados cada una podía
 * quedar a medio actualizar. Un dispatch = una transición.
 */
type AdminState = {
	authed: boolean | null;
	password: string;
	files: FileEntry[];
	doc: Doc | null;
	raw: string;
	savedAt: number | null;
	newSlug: string;
	busy: boolean;
	saving: boolean;
	draft: Draft | null;
};

type AdminAction =
	| { type: "auth/checked"; authed: boolean }
	| { type: "auth/password"; value: string }
	| { type: "auth/signed-in" }
	| { type: "auth/signed-out" }
	| { type: "files/loaded"; files: FileEntry[] }
	| { type: "doc/opened"; doc: Doc; raw: string; draft: Draft | null }
	| { type: "doc/edited"; raw: string }
	| { type: "doc/saved"; sha: string; raw: string; savedAt: number }
	| { type: "doc/cleared" }
	| { type: "draft/restored" }
	| { type: "draft/discarded" }
	| { type: "images/added"; src: string }
	| { type: "slug/changed"; value: string }
	| { type: "busy/changed"; value: boolean }
	| { type: "saving/changed"; value: boolean };

const INITIAL_STATE: AdminState = {
	authed: null,
	password: "",
	files: [],
	doc: null,
	raw: "",
	savedAt: null,
	newSlug: "",
	busy: false,
	saving: false,
	draft: null,
};

function reducer(state: AdminState, action: AdminAction): AdminState {
	switch (action.type) {
		case "auth/checked":
			return { ...state, authed: action.authed };
		case "auth/password":
			return { ...state, password: action.value };
		case "auth/signed-in":
			return { ...state, authed: true, password: "" };
		case "auth/signed-out":
			// Cerrar sesión no debe dejar el documento ni el borrador del anterior a
			// la vista del siguiente que entre en el equipo.
			return {
				...state,
				authed: false,
				password: "",
				files: [],
				doc: null,
				raw: "",
				savedAt: null,
				draft: null,
				saving: false,
			};
		case "files/loaded":
			return { ...state, files: action.files };
		case "doc/opened":
			return {
				...state,
				doc: action.doc,
				raw: action.raw,
				savedAt: null,
				draft: action.draft,
			};
		case "doc/edited":
			return state.raw === action.raw ? state : { ...state, raw: action.raw };
		case "doc/saved":
			if (!state.doc) return state;
			return {
				...state,
				// `savedRaw` es el texto que viajó, no el actual: si se siguió
				// escribiendo durante el guardado, lo nuevo sigue contando como sucio.
				doc: { ...state.doc, sha: action.sha, savedRaw: action.raw },
				savedAt: action.savedAt,
				draft: null,
			};
		case "doc/cleared":
			return { ...state, doc: null, raw: "", savedAt: null, draft: null };
		case "draft/restored":
			return state.draft ? { ...state, raw: state.draft.raw, draft: null } : state;
		case "draft/discarded":
			return { ...state, draft: null };
		case "images/added":
			if (!state.doc) return state;
			return {
				...state,
				doc: {
					...state.doc,
					images: [...new Set([...state.doc.images, action.src])],
				},
			};
		case "slug/changed":
			return { ...state, newSlug: action.value };
		case "busy/changed":
			return { ...state, busy: action.value };
		case "saving/changed":
			return { ...state, saving: action.value };
	}
}

export default function AdminPanel() {
	const { toast } = useToast();
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
	const { authed, password, files, doc, raw, savedAt, newSlug, busy, saving, draft } = state;

	const dirty = doc !== null && raw !== doc.savedRaw;

	const fail = useCallback(
		(error: unknown, fallback: string) => {
			toast({
				title: error instanceof Error ? error.message : fallback,
				variant: "destructive",
			});
		},
		[toast],
	);

	const loadFiles = useCallback(async () => {
		try {
			const data = await request("/api/admin/files");
			dispatch({ type: "files/loaded", files: (data.files as FileEntry[]) ?? [] });
		} catch (error) {
			fail(error, "Could not load the file list");
		}
	}, [fail]);

	const open = useCallback(
		async (next: string) => {
			dispatch({ type: "busy/changed", value: true });
			try {
				const data = await request(`/api/admin/files?path=${encodeURIComponent(next)}`);
				const savedRaw = data.raw as string;
				// Documento y borrador entran juntos: si llegara primero el doc, un
				// render intermedio mostraría el texto del servidor sin avisar del
				// borrador que existe en localStorage.
				dispatch({
					type: "doc/opened",
					doc: {
						path: next,
						sha: data.sha as string,
						savedRaw,
						historyUrl: data.historyUrl as string | undefined,
						images: (data.images as string[]) ?? [],
					},
					raw: savedRaw,
					draft: readDraft(next, savedRaw),
				});
			} catch (error) {
				fail(error, "Could not open the file");
			} finally {
				dispatch({ type: "busy/changed", value: false });
			}
		},
		[fail],
	);

	// Un solo arranque: averiguar si hay sesión y, si la hay, traer la lista.
	// Antes eran dos efectos encadenados: uno escribía `authed` y el otro
	// reaccionaba a ese cambio con otra petición.
	useEffect(() => {
		let alive = true;
		request("/api/admin/auth")
			.then((data) => {
				if (!alive) return;
				const authenticated = Boolean(data.authenticated);
				dispatch({ type: "auth/checked", authed: authenticated });
				if (authenticated) void loadFiles();
			})
			.catch(() => {
				if (alive) dispatch({ type: "auth/checked", authed: false });
			});
		return () => {
			alive = false;
		};
	}, [loadFiles]);

	// Autoguardado del borrador, con retardo: escribir una palabra no debe ser
	// diez escrituras a disco.
	useEffect(() => {
		if (!doc || raw === doc.savedRaw) return;
		const path = doc.path;
		const text = raw;
		const timer = setTimeout(() => {
			try {
				localStorage.setItem(draftKey(path), JSON.stringify({ raw: text, at: Date.now() }));
			} catch {
				// Sin cuota no hay borrador; el botón Guardar sigue ahí.
			}
		}, 800);
		return () => clearTimeout(timer);
	}, [doc, raw]);

	// Aviso del navegador si se cierra la pestaña con cambios sin guardar.
	useEffect(() => {
		if (!dirty) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [dirty]);

	async function login(event: React.FormEvent) {
		event.preventDefault();
		dispatch({ type: "busy/changed", value: true });
		try {
			await request("/api/admin/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});
			dispatch({ type: "auth/signed-in" });
			void loadFiles();
		} catch (error) {
			fail(error, LOGIN_ERROR);
		} finally {
			dispatch({ type: "busy/changed", value: false });
		}
	}

	async function logout() {
		await request("/api/admin/auth", { method: "DELETE" }).catch(() => undefined);
		dispatch({ type: "auth/signed-out" });
	}

	async function save() {
		if (!doc) return;
		// Foto del texto que viaja: `raw` puede cambiar mientras la petición está
		// en vuelo y lo escrito después no debe marcarse como guardado.
		const sent = raw;
		dispatch({ type: "saving/changed", value: true });
		try {
			const data = await request("/api/admin/files", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: doc.path, sha: doc.sha, raw: sent }),
			});
			dispatch({
				type: "doc/saved",
				sha: data.sha as string,
				raw: sent,
				savedAt: Date.now(),
			});
			dropDraft(doc.path);
			toast({
				title: "Saved",
				description: "Changes are live on the site.",
				variant: "success",
			});
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				toast({
					title: "The file changed since you opened it",
					description: "Reopen it so you don't overwrite that change.",
					variant: "destructive",
				});
			} else {
				fail(error, "Could not save");
			}
		} finally {
			dispatch({ type: "saving/changed", value: false });
		}
	}

	async function remove() {
		if (!doc) return;
		dispatch({ type: "busy/changed", value: true });
		try {
			await request(`/api/admin/files?path=${encodeURIComponent(doc.path)}`, { method: "DELETE" });
			dropDraft(doc.path);
			dispatch({ type: "doc/cleared" });
			await loadFiles();
			toast({
				title: "Post deleted",
				description: "Removed from the site.",
				variant: "success",
			});
		} catch (error) {
			fail(error, "Could not delete the post");
		} finally {
			dispatch({ type: "busy/changed", value: false });
		}
	}

	async function create() {
		dispatch({ type: "busy/changed", value: true });
		try {
			const data = await request("/api/admin/files", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ kind: "blog", slug: newSlug, raw: scaffold(newSlug) }),
			});
			dispatch({ type: "slug/changed", value: "" });
			await loadFiles();
			await open(data.path as string);
			toast({
				title: "Post created",
				description: "You can start editing it.",
				variant: "success",
			});
		} catch (error) {
			fail(error, "Could not create the post");
		} finally {
			dispatch({ type: "busy/changed", value: false });
		}
	}

	function uploaded(src: string) {
		toast({
			title: "Image uploaded",
			description: "Inserted into the post.",
			variant: "success",
		});
		dispatch({ type: "images/added", src });
	}

	if (authed === null) {
		return <main className="grid min-h-screen place-items-center text-gray-500">Loading…</main>;
	}

	if (!authed) {
		return (
			<main className="grid min-h-screen place-items-center px-4">
				<form onSubmit={login} className="rise glass w-full max-w-sm rounded-2xl p-8">
					<p className="mb-1 font-display text-xs font-bold uppercase tracking-[0.3em] text-palette-lime">
						wsalas.com
					</p>
					<h1 className="mb-6 font-display text-3xl font-bold uppercase tracking-wide text-white">
						Sign in
					</h1>
					<Input
						type="password"
						autoFocus
						value={password}
						onChange={(event) => dispatch({ type: "auth/password", value: event.target.value })}
						placeholder="Password"
						aria-label="Password"
					/>
					<Button
						type="submit"
						variant="green"
						className="mt-4 w-full"
						disabled={busy || !password}
					>
						{busy ? "Signing in…" : "Sign in"}
					</Button>
				</form>
			</main>
		);
	}

	return (
		<div className="min-h-screen pb-16">
			{/* Barra fija: el wordmark, el archivo abierto y la salida. La ruta del
			    archivo va acá y no solo en el editor porque es la respuesta a "¿dónde
			    estoy editando?" mientras se scrollea. */}
			<header className="glass-strong sticky top-0 z-30 border-b border-white/10">
				<div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
					<div className="flex min-w-0 items-center gap-3">
						<span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
							Admin
						</span>
						<span className="h-4 w-px bg-white/15" />
						<span className="truncate font-mono text-xs text-gray-400">
							{doc ? doc.path : "no file open"}
						</span>
					</div>
					<Button
						type="button"
						onClick={logout}
						variant="outline"
						size="sm"
						className="shrink-0 gap-1.5 text-xs"
					>
						<LogOut className="h-3.5 w-3.5" />
						Sign out
					</Button>
				</div>
			</header>

			<div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[260px_1fr] sm:px-6">
				<aside className="lg:sticky lg:top-20 lg:self-start">
					<div className="custom-scrollbar max-h-[38vh] space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:max-h-[calc(100vh-13rem)]">
						{GROUPS.map(({ kind, label, icon: Icon }) => {
							const group = files.filter((file) => file.kind === kind);
							return (
								<div key={kind}>
									<h2 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-palette-lime">
										<Icon className="h-3.5 w-3.5" />
										{label}
										<span className="text-gray-600">{group.length}</span>
									</h2>
									<ul className="space-y-0.5">
										{group.map((file) => (
											<li key={file.path}>
												<button
													type="button"
													onClick={() => open(file.path)}
													aria-current={file.path === doc?.path ? "true" : undefined}
													className={cn(
														"w-full truncate rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
														file.path === doc?.path
															? "bg-palette-pink/15 font-medium text-palette-pink"
															: "text-gray-400 hover:bg-white/5 hover:text-gray-200",
													)}
												>
													{fileLabel(file.path)}
												</button>
											</li>
										))}
										{group.length === 0 && (
											<li className="px-2.5 py-1.5 text-xs text-gray-600">No files</li>
										)}
									</ul>
								</div>
							);
						})}
					</div>

					<div className="mt-3 flex gap-2">
						<Input
							value={newSlug}
							onChange={(event) => dispatch({ type: "slug/changed", value: event.target.value })}
							placeholder="new-post-slug"
							aria-label="New post slug"
							className="h-9 text-xs"
						/>
						<Button
							size="sm"
							variant="green"
							className="shrink-0"
							disabled={busy || !newSlug}
							onClick={create}
							title="New post"
							aria-label="New post"
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</aside>

				<main className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
					{doc ? (
						<DocEditor
							key={doc.path}
							path={doc.path}
							raw={raw}
							historyUrl={doc.historyUrl}
							images={doc.images}
							dirty={dirty}
							saving={saving}
							savedAt={savedAt}
							draftAt={draft?.at ?? null}
							onChange={(value) => dispatch({ type: "doc/edited", raw: value })}
							onSave={save}
							onDelete={remove}
							onUploaded={uploaded}
							onError={(message) => toast({ title: message, variant: "destructive" })}
							onRestoreDraft={() => dispatch({ type: "draft/restored" })}
							onDiscardDraft={() => {
								if (doc) dropDraft(doc.path);
								dispatch({ type: "draft/discarded" });
							}}
						/>
					) : (
						<div className="grid min-h-[40vh] place-items-center p-10 text-center">
							<div className="max-w-xs">
								<p className="mb-2 font-display text-lg font-bold uppercase tracking-wide text-white">
									No file open
								</p>
								<p className="text-sm text-gray-400">
									Pick a post from the list to edit it, or create a new one with the{" "}
									<span className="text-palette-lime">+</span> button.
								</p>
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}
