"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DownloadResume from "./DownloadResume";
import { CONTACT_EMAIL, PROFILE, SOCIAL_LINKS } from "@/lib/constants";
import { getChromeCopy, getNavPaths, localeFromPathname } from "@/lib/i18n/core";
import { cn } from "@/lib/utils";

const LINK =
	"focus-ring text-sm capitalize text-gray-400 transition-colors hover:text-palette-lime";

/** Marca de Cloudflare (simple-icons, CC0); el naranja es el de su identidad. */
function CloudflareMark({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
			<path d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.6045-.499-1.0615-.5205l-8.6592-.1123a.1559.1559 0 0 1-.1333-.0713c-.0283-.042-.0351-.0986-.021-.1553.0278-.084.1123-.1484.2036-.1562l8.7359-.1123c1.0351-.0489 2.1601-.8868 2.5537-1.9136l.499-1.3013c.0215-.0561.0293-.1128.0147-.168-.5625-2.5463-2.835-4.4453-5.5499-4.4453-2.5039 0-4.6284 1.6177-5.3876 3.8614-.4927-.3658-1.1187-.5625-1.794-.499-1.2026.119-2.1665 1.083-2.2861 2.2856-.0283.31-.0069.6128.0635.894C1.5683 13.171 0 14.7754 0 16.752c0 .1748.0142.3515.0352.5273.0141.083.0844.1475.1689.1475h15.9814c.0909 0 .1758-.0645.2032-.1553l.12-.4268zm2.7568-5.5634c-.0771 0-.1611 0-.2383.0112-.0566 0-.1054.0415-.127.0976l-.3378 1.1744c-.1475.5068-.0918.9707.1543 1.3164.2256.3164.6055.498 1.0625.5195l1.8437.1133c.0557 0 .1055.0263.1329.0703.0283.043.0351.1074.0214.1562-.0283.084-.1132.1485-.204.1553l-1.921.1123c-1.041.0488-2.1582.8867-2.5527 1.914l-.1406.3585c-.0283.0713.0215.1416.0986.1416h6.5977c.0771 0 .1474-.0489.169-.126.1122-.4082.1757-.837.1757-1.2803 0-2.6025-2.125-4.727-4.7344-4.727" />
		</svg>
	);
}

/**
 * No había footer en ningún lado: el layout terminaba en `{children}` y las
 * páginas interiores se acababan en seco, sin ninguna navegación hacia abajo.
 *
 * Es cliente por el mismo motivo que `NavBar` y `ScrollButton`: necesita el
 * pathname para desaparecer en /admin, donde el panel tiene su propio layout.
 *
 * Las tres columnas salen de `paths` y de `SOCIAL_LINKS`: no hay un enlace
 * escrito a mano acá que pueda quedar desincronizado del resto del sitio.
 */
function Footer() {
	const pathname = usePathname();
	if (pathname.startsWith("/admin")) return null;

	const locale = localeFromPathname(pathname);
	const copy = getChromeCopy(locale);
	const paths = getNavPaths(locale);
	const anchors = paths.filter((path) => !path.isRoute);
	const routes = paths.filter((path) => path.isRoute);

	// El idioma solo se puede cambiar donde hay dos versiones que ofrecer: la
	// landing. En /blog o /tools un "Español" llevaría a la landing en español, que
	// no es la página que se está leyendo.
	const isLanding = pathname === "/" || pathname === "/es";

	const socials = [
	// El `rel="me"` de abajo declara que los tres perfiles son de la misma persona
	// que firma el sitio. No es factor de posicionamiento: es verificación de
	// identidad (IndieAuth), que es justamente para lo que existen estos enlaces.
	{ label: "GitHub", href: SOCIAL_LINKS.github },
		{ label: "LinkedIn", href: SOCIAL_LINKS.linkedin },
		{ label: "Upwork", href: SOCIAL_LINKS.upwork },
	];

	return (
		// El pb deja libre la píldora de navegación, que flota fija abajo al centro
		// y taparía el crédito y el wordmark.
		<footer className="relative mt-10 border-t border-white/10 pb-28 md:pb-32">
			<div className="container-page pt-14">
				<div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
					<div className="lg:col-span-1">
						<p className="font-display text-lg font-bold text-white">{PROFILE.name}</p>
						<p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
							{PROFILE.location} · {copy.footer.about}
						</p>
					</div>

					<nav aria-label={copy.footer.onThisPage}>
						<h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-palette-lime">
							{copy.footer.onThisPage}
						</h3>
						<ul className="mt-4 space-y-2.5">
							{anchors.map((path) => (
								<li key={path.name}>
									<a href={path.path} className={LINK}>
										{path.name}
									</a>
								</li>
							))}
						</ul>
					</nav>

					<nav aria-label={copy.footer.more}>
						<h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-palette-lime">
							{copy.footer.more}
						</h3>
						<ul className="mt-4 space-y-2.5">
							{routes.map((path) => (
								<li key={path.name}>
									<Link href={path.path} className={LINK}>
										{path.name}
									</Link>
								</li>
							))}
							<li>
								{/* `normal-case`: el `capitalize` de LINK existe para los nombres de
								    `paths` ("about" → "About"), pero convertía el correo en
								    "Wa.Salas1905@Hotmail.Com". */}
								<a
									href={`mailto:${CONTACT_EMAIL}`}
									className={cn(LINK, "normal-case")}
								>
									{CONTACT_EMAIL}
								</a>
							</li>
						</ul>
					</nav>

					<nav aria-label={copy.footer.elsewhere}>
						<h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-palette-lime">
							{copy.footer.elsewhere}
						</h3>
						<ul className="mt-4 space-y-2.5">
							{socials.map((social) => (
								<li key={social.label}>
									<a
										href={social.href}
										target="_blank"
										rel="noopener noreferrer me"
										className={LINK}
									>
										{social.label}
									</a>
								</li>
							))}
							<li className="pt-1">
								<DownloadResume />
							</li>
						</ul>
					</nav>
				</div>

				{/* Tres pistas [1fr auto 1fr]: la columna central mide lo suyo y las
				    laterales se reparten el resto en partes iguales, así el crédito de
				    build queda centrado aunque el copyright y el idioma midan distinto. */}
				<div className="mt-12 flex flex-col items-center gap-3 border-t border-white/10 pt-6 text-center text-xs text-gray-500 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:text-left">
					<p>
						© {new Date().getFullYear()} {PROFILE.name}. {copy.footer.rights}
					</p>
					<p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
						<span>{copy.footer.builtWith}</span>
						<span aria-hidden className="text-white/25">
							·
						</span>
						<a
							href="https://www.cloudflare.com"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 transition-colors hover:text-palette-lime"
						>
							<CloudflareMark className="h-3.5 w-3.5 shrink-0 text-[#F38020]" />
							{copy.footer.deployedOn}
						</a>
					</p>
					{/* Los nombres de idioma son endónimos y no se traducen: quien no
					    entiende el idioma actual necesita reconocer el suyo escrito como
					    él lo escribe. `hrefLang` es para el navegador, no para el ojo. */}
					{isLanding && (
						<Link
							href={locale === "en" ? "/es" : "/"}
							hrefLang={locale === "en" ? "es" : "en"}
							className={cn(LINK, "normal-case font-medium sm:justify-self-end")}
						>
							{locale === "en" ? "Español" : "English"}
						</Link>
					)}
				</div>
			</div>
		</footer>
	);
}

export default Footer;
