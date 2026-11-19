"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import DownloadResume from "./DownloadResume";
import { Button } from "./ui/button";
import { Video, Menu, X } from "lucide-react";
import { CALENDAR_URL } from "@/lib/constants";
import { getChromeCopy, getNavPaths, localeFromPathname } from "@/lib/i18n/core";
import { usePathname } from "next/navigation";
import Image from "next/image";

function NavBar() {
	const [isOpen, setIsOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [isHidden, setIsHidden] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		let lastY = window.scrollY;
		const handleScroll = () => {
			const y = window.scrollY;
			setIsScrolled(y > 20);
			// La píldora flota sobre el contenido, así que al bajar tapaba la
			// franja donde viven los precios y los CTAs. Se esconde solo bajando:
			// cualquier gesto hacia arriba la devuelve, cerca del tope nunca se
			// va, y el foco de teclado la trae de vuelta (onFocusCapture).
			// El umbral de 4px descarta el ruido de trackpads y ruedas.
			if (Math.abs(y - lastY) > 4) {
				if (y > 240 && y > lastY) setIsHidden(true);
				else if (y < lastY) setIsHidden(false);
				lastY = y;
			}
		};
		// Al recargar a media página el estado inicial está en 0: una pasada
		// ahora evita que la píldora arranque con el vidrio sin scroll.
		handleScroll();
		// passive: el handler solo lee scrollY, marcarlo así evita que el navegador
		// espere a que termine antes de pintar el scroll.
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const locale = localeFromPathname(pathname);
	// El layout raíz no recibe `[locale]`, así que la nav —como el footer— saca el
	// idioma de la ruta en vez de esperar una prop.
	const copy = getChromeCopy(locale);
	const systemPaths = getNavPaths(locale);

	const paths = pathname.includes("blog")
		? systemPaths.filter((p) => p.name === copy.nav.blog)
		: systemPaths;

	// El panel tiene su propia barra. La nav del sitio flota abajo al centro y le
	// tapa la esquina del editor.
	if (pathname.startsWith("/admin")) return null;

	const NavItem = ({ path }: { path: (typeof paths)[0] }) => {
		const isActive = pathname === path.path;

		if (path.isRoute) {
			return (
				<Link
					className="focus-ring whitespace-nowrap font-medium hover:text-palette-lime transition-colors duration-300"
					href={path.path}
				>
					{path.name}
				</Link>
			);
		}

		return (
				<a
				className={`focus-ring whitespace-nowrap font-medium transition-colors duration-300 ${
					isActive ? "text-palette-lime" : "hover:text-palette-lime"
				}`}
				href={path.path}
			>
				{path.name}
			</a>
		);
	};

	const MobileNavItem = ({ path }: { path: (typeof paths)[0] }) => {
		if (path.isRoute) {
			return (
				<Link
					key={path.name}
					href={path.path}
					className="focus-ring text-2xl font-semibold text-gray-300 hover:text-palette-lime transition-colors"
					onClick={() => setIsOpen(false)}
				>
					{path.name}
				</Link>
			);
		}

		return (
			<a
				key={path.name}
				href={path.path}
				className="focus-ring text-2xl font-semibold text-gray-300 hover:text-palette-lime transition-colors"
				onClick={() => setIsOpen(false)}
			>
				{path.name}
			</a>
		);
	};

	return (
		<>
			<nav
				onFocusCapture={() => setIsHidden(false)}
				// `env(safe-area-inset-bottom)` sube la píldora sobre el indicador
				// de inicio del iPhone; en escritorio el valor es 0 y `bottom-6`
				// queda idéntico. `translate-y-[…]` y el `-translate-x-1/2` de
				// antes no chocan: Tailwind los escribe en variables distintas.
				className={`fixed font-display font-bold bottom-[calc(1.5rem+env(safe-area-inset-bottom))] py-3 left-1/2 -translate-x-1/2 w-[90%] md:w-[50%] lg:w-max max-w-[95%] rounded-2xl z-nav transition-[transform,background-color,box-shadow,border-color] duration-300 motion-reduce:transition-none ${
					isHidden && !isOpen
						? "translate-y-[calc(100%+2.5rem)]"
						: "translate-y-0"
				} ${
					isScrolled
						? "glass-strong shadow-2xl glow-lime-hover"
						: "glass shadow-lg "
				}`}
			>
				<div className="flex items-center justify-between gap-6 px-6 md:px-8">

					<Link href="/" className="flex shrink-0 items-center">
						<span className="font-bold text-palette-lime">{"<"}</span>
						<Image
							src="/images/logo-page.png"
							alt="Logo"
							width={40}
							height={40}
						/>
							<span className="font-bold text-palette-lime">{">"}</span>
						</Link>
						<ul className="hidden lg:flex gap-6">
							{paths.map((path) => (
								<li key={path.name}>
									<NavItem path={path} />
								</li>
							))}
						</ul>




					<button
						// 44×44 con `p-2.5` y el `-m-2.5` que devuelve el ícono a su sitio:
						// el objetivo táctil de 24×24 quedaba por debajo del mínimo.
						className="lg:hidden text-white p-2.5 -m-2.5"
						onClick={() => setIsOpen(!isOpen)}
						aria-expanded={isOpen}
						aria-controls="mobile-menu"
						aria-label={isOpen ? copy.chrome.menuClose : copy.chrome.menuOpen}
					>
						{isOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>
			</nav>

			{/* Mobile Menu */}
			<div
				id="mobile-menu"
				// Cerrado sigue en el DOM (para poder animar la salida), así que sin
				// esto el tabulador entra a links que están fuera de pantalla.
				inert={!isOpen}
				// `overflow-y-auto` no es decorativo. El panel mide una pantalla
				// (`inset-0`) y el contenido mide 688px fijos, así que en cualquier
				// viewport más bajo el contenido se sale de la caja. Con
				// `-translate-y-full` el panel sube una pantalla y esa sobra
				// reaparece ARRIBA: los dos botones del final, cortados, encima del
				// hero. Se veía en el teléfono (≈600px con la barra del navegador
				// visible) y no en escritorio (≥700px). El overflow recorta la sobra
				// y de paso deja el menú desplazable en pantallas cortas.
				className={`fixed inset-0 glass-strong z-dropdown transform transition-transform duration-300 ease-in-out overflow-y-auto ${
					isOpen ? "translate-y-0" : "-translate-y-full"
				} lg:hidden`}
			>
				{/* El `pb` deja el último botón por encima de la píldora de nav, que
				    flota en `bottom-6` y tiene z mayor que este panel. */}
				<div className="flex flex-col items-center pt-32 px-4 pb-24 space-y-8">
					{paths.map((path) => (
						<MobileNavItem key={path.name} path={path} />
					))}

					<div className="flex flex-col text-[16px] w-full gap-4 pt-6 max-w-xs">
						<DownloadResume />
						<a
							href={CALENDAR_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full"
						>
							<Button
								variant="green"
								className="w-full"
								size="sm"
							>
								<Video />
								{copy.chrome.bookMeeting}
							</Button>
						</a>
					</div>
				</div>
			</div>
		</>
	);
}

export default NavBar;
