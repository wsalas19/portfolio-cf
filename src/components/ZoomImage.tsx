"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image } from "@unpic/react";
import { X } from "lucide-react";

interface ZoomImageProps {
	src: string;
	alt: string;
	/** Lo que carga el visor, cuando no es la misma imagen que la miniatura. */
	expandSrc?: string;
	/** Clases del botón que envuelve la miniatura. Limita el ancho, nunca la altura. */
	wrapperClassName?: string;
	sizes?: string;
}

// Miniatura clicable que abre la imagen completa. El <dialog> se monta en un
// portal: es flow content y no puede anidarse dentro del <p> que react-markdown
// genera alrededor de cada imagen. showModal() aporta gratis el cierre con
// Escape, el fondo inerte y el focus trap.
export function ZoomImage({
	src,
	alt,
	expandSrc = src,
	wrapperClassName = "mx-auto block w-full cursor-zoom-in sm:max-w-md",
	sizes = "(max-width: 640px) 100vw, 448px",
}: ZoomImageProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [open, setOpen] = useState(false);

	// Sin `mounted` ni portal desde el primer render: el diálogo solo existe
	// después del clic, así que servidor y cliente pintan lo mismo y no hay
	// desajuste de hidratación. El ref lo abre en el commit, que es el momento
	// en que el elemento nativo ya está en el DOM.
	const attachDialog = useCallback((dialog: HTMLDialogElement | null) => {
		dialogRef.current = dialog;
		if (dialog && !dialog.open) dialog.showModal();
	}, []);

	return (
		<>
			{/* El botón limita el ancho (no la altura) para no cortar la línea de
			    lectura: w-full + h-auto respeta la relación de aspecto original. */}
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label={`Expand image: ${alt}`}
				className={wrapperClassName}
			>
				{/* width/height en 0 + w-full h-auto: Next genera el srcset sin
				    imponer una relación de aspecto que la foto no tiene. */}
				<Image
					src={src}
					alt={alt}
					layout="fullWidth"
					sizes={sizes}
					className="h-auto w-full rounded-lg border border-white/10 transition-opacity duration-200 hover:opacity-90"
				/>
			</button>

			{open &&
				createPortal(
					// open:* en vez de flex a secas: un display puesto a mano gana sobre
					// el `dialog:not([open]){display:none}` del navegador, y el visor
					// quedaría visible al final del artículo aunque esté cerrado.
					<dialog
						ref={attachDialog}
						onClose={() => setOpen(false)}
						onClick={(e) => {
							// El click en el backdrop tiene como target el propio <dialog>.
							if (e.target === dialogRef.current) dialogRef.current?.close();
						}}
						className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/90 open:flex open:flex-col open:items-center open:gap-6"
					>
						{/* El visor sirve la imagen original, no una copia del optimizador. */}
						<img
							src={expandSrc}
							alt={alt}
							className="max-h-[74vh] max-w-[88vw] rounded-2xl border border-white/20 object-contain"
						/>
						{/* Cierre debajo de la foto: al no superponerse, el borde de la
						    imagen nunca queda recortado por el botón. */}
						<button
							type="button"
							onClick={() => dialogRef.current?.close()}
							aria-label="Close image"
							className="shrink-0 rounded-full border border-white/30 p-3.5 text-white/70 transition-colors hover:border-palette-lime hover:text-palette-lime"
						>
							<X size={20} />
						</button>
					</dialog>,
					document.body,
				)}
		</>
	);
}
