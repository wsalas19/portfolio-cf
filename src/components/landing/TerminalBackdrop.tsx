"use client";

import { useEffect, useState } from "react";
import FaultyTerminal from "../FaultyTerminal";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * El terminal WebGL de fondo, con dos decisiones que `FaultyTerminal` no puede
 * tomar sola porque es un componente de render puro:
 *
 * 1. `prefers-reduced-motion`: el shader anima glifos de alta frecuencia detrás
 *    de todo el texto. `FaultyTerminal` ya acepta `pause` —congela `iTime` y
 *    deja de recomponer— así que acá solo se lee la preferencia y se le pasa.
 *    Arranca en pausa y se reanuda en el efecto: al revés, quien pidió menos
 *    movimiento vería un frame animado antes de que el efecto corra.
 * 2. El velo. El canvas corre a `brightness=0.18`, pero eso alcanza para un
 *    fondo decorativo y no para texto: los enlaces del footer y las preguntas
 *    del FAQ quedaban sobre glifos en movimiento. El degradado mantiene el
 *    brillo arriba, donde vive el hero, y aplana el resto.
 */
export default function TerminalBackdrop() {
	const [paused, setPaused] = useState(true);

	useEffect(() => {
		const query = window.matchMedia(REDUCED_MOTION);
		const sync = () => setPaused(query.matches);
		sync();
		query.addEventListener("change", sync);
		return () => query.removeEventListener("change", sync);
	}, []);

	return (
		<div className="fixed inset-0 -z-10">
			<FaultyTerminal
				scale={2.2}
				gridMul={[2, 1]}
				digitSize={1.5}
				timeScale={0.5}
				pause={paused}
				scanlineIntensity={0.5}
				glitchAmount={1}
				flickerAmount={1}
				noiseAmp={0.8}
				chromaticAberration={0}
				dither={0}
				curvature={0.26}
				tint="#d4ff4d"
				mouseReact
				mouseStrength={0.5}
				pageLoadAnimation
				brightness={0.18}
			/>
			{/* El velo no captura eventos: es decoración. */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_0%,rgba(28,28,28,0.28)_0%,rgba(28,28,28,0.66)_55%,rgba(28,28,28,0.86)_100%)]"
			/>
		</div>
	);
}
