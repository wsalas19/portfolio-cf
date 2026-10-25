"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { BlogPost } from "@/components/blog/BlogPost";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ExternalLink, ImagePlus, RotateCcw, Save, Trash2 } from "lucide-react";

type Mode = "editor" | "preview" | "split";

const MODES: { id: Mode; label: string }[] = [
	{ id: "editor", label: "Editor" },
	{ id: "split", label: "Split" },
	{ id: "preview", label: "Preview" },
];

const TIME = { hour: "2-digit", minute: "2-digit" } as const;

interface DocEditorProps {
	path: string;
	raw: string;
	historyUrl?: string;
	images: string[];
	dirty: boolean;
	saving: boolean;
	savedAt: number | null;
	draftAt: number | null;
	onChange: (raw: string) => void;
	onSave: () => void;
	onDelete: () => void;
	onUploaded: (src: string) => void;
	onRestoreDraft: () => void;
	onDiscardDraft: () => void;
	onError: (message: string) => void;
}

/**
 * El estado de guardado es el indicador que importa en esta pantalla: acá cada
 * guardado es un commit y un rebuild, así que el punto de color dice si lo que
 * se está leyendo ya está en git. Verde = guardado, rosa = hay cambios sin
 * guardar, gris latiendo = viajando.
 */
function SaveState({ dirty, saving, savedAt }: Pick<DocEditorProps, "dirty" | "saving" | "savedAt">) {
	if (saving) {
		return (
			<span className="flex items-center gap-2 text-xs text-gray-400">
				<span className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
				Saving…
			</span>
		);
	}

	if (dirty) {
		return (
			<span className="flex items-center gap-2 text-xs text-palette-pink">
				<span className="h-2 w-2 rounded-full bg-palette-pink" />
				Unsaved changes
			</span>
		);
	}

	return (
		<span className="flex items-center gap-2 text-xs text-palette-lime">
			<span className="h-2 w-2 rounded-full bg-palette-lime glow-lime" />
			{savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString("en-US", TIME)}` : "Saved"}
		</span>
	);
}

/** La etiqueta de columna: sin ella, en modo dividido no se sabe cuál mitad es cuál. */
function PaneLabel({ children }: { children: string }) {
	return (
		<span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
			{children}
		</span>
	);
}

function ImageTile({
	src,
	used,
	onInsert,
}: {
	src: string;
	used: boolean;
	onInsert: () => void;
}) {
	// Una imagen recién subida todavía no está en el `public/` desplegado: hasta
	// que termine el rebuild la URL da 404. En vez de un cuadro roto, se muestra
	// el nombre del archivo — que es la información útil igual.
	const [broken, setBroken] = useState(false);

	return (
		<button
			type="button"
			onClick={onInsert}
			title={src.split("/").pop()}
			className={cn(
				"group relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition-all",
				used
					? "border-palette-lime/60"
					: "border-white/10 hover:border-palette-pink/60",
			)}
		>
			{broken ? (
				<span className="flex h-full w-full items-center justify-center bg-white/5 px-2 text-[10px] leading-tight text-gray-400">
					{src.split("/").pop()}
				</span>
			) : (
				<Image
					src={src}
					alt=""
					width={96}
					height={64}
					unoptimized
					onError={() => setBroken(true)}
					className="h-full w-full object-cover"
				/>
			)}
			{used && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-palette-lime" />}
		</button>
	);
}

export function DocEditor({
	path,
	raw,
	historyUrl,
	images,
	dirty,
	saving,
	savedAt,
	draftAt,
	onChange,
	onSave,
	onDelete,
	onUploaded,
	onRestoreDraft,
	onDiscardDraft,
	onError,
}: DocEditorProps) {
	const [mode, setMode] = useState<Mode>("split");
	const [dragging, setDragging] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const editorRef = useRef<HTMLTextAreaElement>(null);

	const slug = path.split("/").pop()?.replace(/\.md$/, "") ?? "";
	const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

	function insert(text: string) {
		const editor = editorRef.current;
		const at = editor ? editor.selectionStart : raw.length;
		onChange(`${raw.slice(0, at)}${text}${raw.slice(at)}`);

		// Devolver el cursor después de lo insertado: sin esto el foco se queda en
		// el botón y el siguiente insert va al principio del archivo.
		requestAnimationFrame(() => {
			editor?.focus();
			editor?.setSelectionRange(at + text.length, at + text.length);
		});
	}

	async function upload(file: File) {
		setUploading(true);
		try {
			const form = new FormData();
			form.append("file", file);
			form.append("slug", slug);

			const response = await fetch("/api/admin/upload", { method: "POST", body: form });
			const data = (await response.json().catch(() => ({}))) as {
				error?: string;
				path?: string;
			};
			if (!response.ok) throw new Error(data.error || "Could not upload the image");
			if (!data.path) throw new Error("Upload did not return a path");

			insert(`![${file.name}](${data.path})`);
			onUploaded(data.path);
		} catch (error) {
			onError(error instanceof Error ? error.message : "Could not upload the image");
		} finally {
			setUploading(false);
		}
	}

	function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (file) void upload(file);
	}

	function handleDrop(event: React.DragEvent) {
		event.preventDefault();
		setDragging(false);
		const file = Array.from(event.dataTransfer.files).find((f) => f.type.startsWith("image/"));
		if (file) void upload(file);
	}

	function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
		const file = Array.from(event.clipboardData.files).find((f) => f.type.startsWith("image/"));
		if (!file) return;
		event.preventDefault();
		void upload(file);
	}

	return (
		<div className="rise">
			{/* Cabecera del documento: qué se está editando, si está guardado, y las
			    tres acciones. Guardar es la única con color, es la que se busca. */}
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
				<div className="flex min-w-0 items-center gap-3">
					<h2 className="truncate font-display text-base font-bold uppercase tracking-wide text-white">
						{slug || path}
					</h2>
					<SaveState dirty={dirty} saving={saving} savedAt={savedAt} />
				</div>

				<div className="flex items-center gap-2">
					{historyUrl && (
						<Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
							<a href={historyUrl} target="_blank" rel="noopener noreferrer">
								History
								<ExternalLink className="h-3 w-3" />
							</a>
						</Button>
					)}

					{confirmingDelete ? (
						<span className="flex items-center gap-1 text-xs">
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={() => {
									setConfirmingDelete(false);
									onDelete();
								}}
							>
								Yes, delete
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setConfirmingDelete(false)}
							>
								Cancel
							</Button>
						</span>
					) : (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => setConfirmingDelete(true)}
							title={`Delete ${slug}.md`}
							aria-label={`Delete ${slug}.md`}
							className="h-9 w-9 text-gray-400 hover:bg-red-500/10 hover:text-red-300"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					)}
					<Button variant="green" size="sm" onClick={onSave} disabled={saving || !dirty}>
						<Save className="mr-1 h-3 w-3" />
						Save
					</Button>
				</div>
			</div>

			{/* Barra de herramientas: modo de vista y subida. El selector de modo va
			    siempre visible porque a 1024px las dos columnas quedan de 380px y ahí
			    la vista previa estorba más de lo que ayuda. */}
			<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
				<div className="flex rounded-lg border border-white/10 p-0.5">
					{MODES.map((option) => (
						<button
							key={option.id}
							type="button"
							onClick={() => setMode(option.id)}
							className={cn(
								"rounded-md px-3 py-1 text-xs transition-colors",
								mode === option.id
									? "bg-white/10 text-white"
									: "text-gray-400 hover:text-gray-200",
							)}
						>
							{option.label}
						</button>
					))}
				</div>

				<label className="glass-subtle flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-palette-lime/40 hover:text-white">
					<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickFile} />
					<ImagePlus className="h-3.5 w-3.5" />
					{uploading ? "Uploading…" : "Upload image"}
				</label>
			</div>

			{draftAt !== null && (
				<div className="mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-300 sm:mx-6">
					<span>
						An unsaved draft from {new Date(draftAt).toLocaleTimeString("en-US", TIME)}.
					</span>
					<button
						type="button"
						onClick={onRestoreDraft}
						className="flex items-center gap-1 font-medium text-palette-lime hover:underline"
					>
						<RotateCcw className="h-3 w-3" />
						Restore
					</button>
					<button
						type="button"
						onClick={onDiscardDraft}
						className="text-gray-400 hover:text-white"
					>
						Discard
					</button>
				</div>
			)}

			<div
				onDragOver={(event) => {
					event.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={handleDrop}
				className={cn(
					"grid gap-4 px-4 pb-4 sm:px-6",
					mode === "split" ? "lg:grid-cols-2" : "grid-cols-1",
				)}
			>
				{mode !== "preview" && (
					<div className="relative flex h-[58vh] flex-col lg:h-[68vh]">
						<PaneLabel>Markdown</PaneLabel>
						<Textarea
							ref={editorRef}
							value={raw}
							onChange={(event) => onChange(event.target.value)}
							onPaste={handlePaste}
							spellCheck={false}
							aria-label={`Markdown for ${slug}`}
							className="custom-scrollbar h-full flex-1 resize-none font-mono text-xs leading-relaxed"
						/>
						{/* Se suelta en cualquier parte del editor, no en una zona aparte:
						    el destino obvio de una captura es el documento que se está
						    escribiendo. */}
						{dragging && (
							<div className="pointer-events-none absolute inset-x-0 bottom-0 top-6 flex items-center justify-center rounded-md border-2 border-dashed border-palette-lime bg-palette-canvas/80 text-sm text-palette-lime">
								Drop to upload the image
							</div>
						)}
					</div>
				)}

				{mode !== "editor" && (
					<div className="flex h-[58vh] flex-col lg:h-[68vh]">
						<PaneLabel>Preview</PaneLabel>
						<div className="custom-scrollbar flex-1 overflow-y-auto rounded-md border border-white/10 bg-palette-card/60 p-5">
							<BlogPost content={body} />
						</div>
					</div>
				)}
			</div>

			{images.length > 0 && (
				<div className="border-t border-white/10 px-4 py-4 sm:px-6">
					<h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-palette-lime">
						Post images · {images.length}
					</h3>
					<div className="custom-scrollbar flex gap-2 overflow-x-auto pb-2">
						{images.map((src) => (
							<ImageTile
								key={src}
								src={src}
								used={raw.includes(src)}
								onInsert={() => insert(`![](${src})`)}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
