"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

// Los borradores viven en el navegador y no en git: cada guardado es un commit y
// un rebuild, así que autoguardar al repositorio convertiría una frase en cinco
// deploys. `ponytail:` localStorage, sin servidor; si algún día se edita desde
// dos equipos, el borrador deja de alcanzar.
const draftKey = (path: string) => `admin-draft:${path}`;

function readDraft(path: string, serverRaw: string): { raw: string; at: number } | null {
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

export default function AdminPanel() {
	const { toast } = useToast();
	const [authed, setAuthed] = useState<boolean | null>(null);
	const [password, setPassword] = useState("");
	const [files, setFiles] = useState<FileEntry[]>([]);
	const [doc, setDoc] = useState<Doc | null>(null);
	const [raw, setRaw] = useState("");
	const [savedAt, setSavedAt] = useState<number | null>(null);
	const [newSlug, setNewSlug] = useState("");
	const [busy, setBusy] = useState(false);
	const [saving, setSaving] = useState(false);
	const draftRef = useRef<{ raw: string; at: number } | null>(null);
	const [draftAt, setDraftAt] = useState<number | null>(null);

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
			setFiles((data.files as FileEntry[]) ?? []);
		} catch (error) {
			fail(error, "Could not load the file list");
		}
	}, [fail]);

	const open = useCallback(
		async (next: string) => {
			setBusy(true);
			try {
				const data = await request(`/api/admin/files?path=${encodeURIComponent(next)}`);
				const savedRaw = data.raw as string;
				setDoc({
					path: next,
					sha: data.sha as string,
					savedRaw,
					historyUrl: data.historyUrl as string | undefined,
					images: (data.images as string[]) ?? [],
				});
				setRaw(savedRaw);
				setSavedAt(null);
				const draft = readDraft(next, savedRaw);
				draftRef.current = draft;
				setDraftAt(draft?.at ?? null);
			} catch (error) {
				fail(error, "Could not open the file");
			} finally {
				setBusy(false);
			}
		},
		[fail],
	);

	useEffect(() => {
		request("/api/admin/auth")
			.then((data) => setAuthed(Boolean(data.authenticated)))
			.catch(() => setAuthed(false));
	}, []);

	useEffect(() => {
		if (authed) void loadFiles();
	}, [authed, loadFiles]);

	// Autoguardado del borrador, con retardo: escribir una palabra no debe ser
	// diez escrituras a disco.
	useEffect(() => {
		if (!doc || raw === doc.savedRaw) return;
		const timer = setTimeout(() => {
			try {
				localStorage.setItem(draftKey(doc.path), JSON.stringify({ raw, at: Date.now() }));
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
		setBusy(true);
		try {
			await request("/api/admin/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});
			setPassword("");
			setAuthed(true);
		} catch (error) {
			fail(error, LOGIN_ERROR);
		} finally {
			setBusy(false);
		}
	}

	async function logout() {
		await request("/api/admin/auth", { method: "DELETE" }).catch(() => undefined);
		setAuthed(false);
		setFiles([]);
		setDoc(null);
		setRaw("");
	}

	async function save() {
		if (!doc) return;
		setSaving(true);
		try {
			const data = await request("/api/admin/files", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: doc.path, sha: doc.sha, raw }),
			});
			setDoc({ ...doc, sha: data.sha as string, savedRaw: raw });
			setSavedAt(Date.now());
			dropDraft(doc.path);
			draftRef.current = null;
			setDraftAt(null);
			toast({ title: "Saved", description: "The site rebuilds in about a minute." });
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
			setSaving(false);
		}
	}

	async function remove() {
		if (!doc) return;
		setBusy(true);
		try {
			await request(`/api/admin/files?path=${encodeURIComponent(doc.path)}`, { method: "DELETE" });
			dropDraft(doc.path);
			setDoc(null);
			setRaw("");
			setDraftAt(null);
			await loadFiles();
			toast({ title: "Post deleted", description: "It leaves the site on the next rebuild." });
		} catch (error) {
			fail(error, "Could not delete the post");
		} finally {
			setBusy(false);
		}
	}

	async function create() {
		setBusy(true);
		try {
			const data = await request("/api/admin/files", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ kind: "blog", slug: newSlug, raw: scaffold(newSlug) }),
			});
			setNewSlug("");
			await loadFiles();
			await open(data.path as string);
			toast({ title: "Post created" });
		} catch (error) {
			fail(error, "Could not create the post");
		} finally {
			setBusy(false);
		}
	}

	function uploaded(src: string) {
		toast({ title: "Image uploaded", description: "It shows on the site after the rebuild." });
		setDoc((current) => (current ? { ...current, images: [...new Set([...current.images, src])] } : current));
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
						onChange={(event) => setPassword(event.target.value)}
						placeholder="Password"
						aria-label="Password"
					/>
					<Button
						type="submit"
						variant="pink"
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
					<button
						type="button"
						onClick={logout}
						className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-palette-pink/50 hover:text-white"
					>
						<LogOut className="h-3.5 w-3.5" />
						Sign out
					</button>
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
							onChange={(event) => setNewSlug(event.target.value)}
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
							draftAt={draftAt}
							onChange={setRaw}
							onSave={save}
							onDelete={remove}
							onUploaded={uploaded}
							onError={(message) => toast({ title: message, variant: "destructive" })}
							onRestoreDraft={() => {
								if (!draftRef.current) return;
								setRaw(draftRef.current.raw);
								setDraftAt(null);
							}}
							onDiscardDraft={() => {
								if (doc) dropDraft(doc.path);
								draftRef.current = null;
								setDraftAt(null);
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
