"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { getChromeCopy, localeFromPathname } from "@/lib/i18n/core";

function ScrollButton() {
	const [visible, setVisible] = useState(false);
	// Sobre el formulario de contacto el botón flotante caía encima de los campos
	// (en móvil, sobre el input de correo). Ahí es donde se convierte: el botón se
	// aparta mientras esa sección está en pantalla y vuelve en el footer.
	const [overContact, setOverContact] = useState(false);
	const pathname = usePathname();
	const copy = getChromeCopy(localeFromPathname(pathname));

	const toggleVisible = () => {
		const scrolled = document.documentElement.scrollTop;
		if (scrolled > 300) {
			setVisible(true);
		} else if (scrolled <= 300) {
			setVisible(false);
		}
	};

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	useEffect(() => {
		if (typeof window !== "undefined") {
			window.addEventListener("scroll", toggleVisible);

			return () => {
				window.removeEventListener("scroll", toggleVisible);
			};
		}
	}, []);

	// `#contact` solo existe en la landing; en el resto de las rutas el observer
	// no se engancha y el botón se comporta como antes.
	useEffect(() => {
		const target = document.getElementById("contact");
		if (!target) {
			setOverContact(false);
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => setOverContact(entry.isIntersecting),
			// La franja central: el botón desaparece cuando la tarjeta domina la
			// pantalla, no cuando asoma por el borde.
			{ rootMargin: "-25% 0px -25% 0px" },
		);
		observer.observe(target);
		return () => observer.disconnect();
	}, [pathname]);

	// Igual que la nav: en el panel estorba.
	if (pathname.startsWith("/admin")) return null;

	const shown = visible && !overContact;

	return (
		<Button
			onClick={scrollToTop}
			variant={"outline"}
			// `bottom-24` en móvil: la píldora de nav ocupa la franja inferior y
			// este botón quedaba debajo de ella, invisible y sin poder tocarlo.
			// `opacity` en vez de `display` para no sacar el botón del flujo de
			// foco de golpe; `tabIndex`/`aria-hidden` lo compensan cuando no se ve.
			className={`fixed right-4 md:right-10 bottom-24 md:bottom-9 glass-strong shadow-2xl z-nav aspect-square rounded-full hover:bg-palette-lime hover:text-gray-900 hover:border-palette-lime font-semibold transition-opacity duration-300 motion-reduce:transition-none ${
				shown ? "opacity-100" : "pointer-events-none opacity-0"
			}`}
			aria-hidden={!shown}
			tabIndex={shown ? 0 : -1}
		>
			{/* <ChevronUp /> */}
			{copy.chrome.backToTop}
		</Button>
	);
}
export default ScrollButton;
