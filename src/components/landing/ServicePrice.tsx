"use client";

import { useSyncExternalStore } from "react";
import { Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CALENDAR_URL, WHATSAPP_NUMBER } from "@/lib/constants";
import {
	amountFor,
	currencyForCountry,
	fillTemplate,
	formatPrice,
	whatsappUrl,
} from "@/lib/pricing";
import type { LandingCopy } from "@/lib/i18n/types";
import type { Currency, ServiceTrack } from "@/lib/types/globals";

// Solo las etiquetas que este componente usa. Recibir `LandingCopy` entera no
// rompe nada, pero deja el contrato abierto y tienta a leer cualquier cosa.
type PriceCopy = Pick<
	LandingCopy["servicesSection"],
	"priceFrom" | "priceOnce" | "pricePerMonth" | "askWhatsApp" | "bookCall" | "whatsappMessage"
>;

// La moneda la decide el país, no el idioma: alguien en Colombia leyendo el
// sitio en inglés ve pesos. El middleware deja `geo=<país ISO-2>` en una cookie
// horneada desde `x-vercel-ip-country`, así que no hay request extra.
function countryFromCookie(): string | undefined {
	if (typeof document === "undefined") return undefined;

	const entry = document.cookie
		.split("; ")
		.find((row) => row.startsWith("geo="));

	return entry?.slice(4);
}

// Sin cookie (dev local, o preview sin la cabecera de Vercel) queda una pista:
// la zona horaria. Es menos fiable que la IP —un colombiano con VPN ve dólares—
// pero evita que en `pnpm dev` el precio salga siempre en USD.
function countryFromTimezone(): string | undefined {
	try {
		const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return zone === "America/Bogota" ? "CO" : undefined;
	} catch {
		return undefined;
	}
}

interface ServicePriceProps {
	price: NonNullable<ServiceTrack["price"]>;
	title: string;
	priceFrom?: boolean;
	pricePeriod?: "month";
	cta?: "whatsapp" | "calendar";
	copy: PriceCopy;
}

// El navegador no notifica cambios de cookie ni de zona horaria, así que no hay
// nada a lo que suscribirse: el valor se lee una vez y no cambia en la sesión.
const subscribeToNothing = () => () => {};

function browserCurrency(): Currency {
	return currencyForCountry(countryFromCookie() ?? countryFromTimezone());
}

function serverCurrency(): Currency {
	return "USD";
}

function ServicePrice({
	price,
	title,
	priceFrom,
	pricePeriod,
	cta,
	copy,
}: ServicePriceProps) {
	// El servidor renderiza USD, así que ese es el snapshot de hidratación; ya
	// montado, React compara con el del navegador y repinta si hay país. Antes
	// esto era un `useEffect` que hacía `setCurrency`, es decir, un commit extra
	// para leer un valor que nunca vuelve a cambiar.
	const currency = useSyncExternalStore(
		subscribeToNothing,
		browserCurrency,
		serverCurrency,
	);

	const priceLabel = formatPrice(amountFor(price, currency), currency);
	const usesCalendar = cta === "calendar";

	const message = fillTemplate(copy.whatsappMessage, {
		service: title,
		price: priceLabel,
	});
	const whatsappLink = whatsappUrl(WHATSAPP_NUMBER, message);

	// El retainer se acota en llamada. El `!whatsappLink` es por si alguien deja
	// el número vacío en `constants.ts`: el botón cae al calendario en vez de
	// apuntar a un `wa.me` roto.
	const href = usesCalendar || !whatsappLink ? CALENDAR_URL : whatsappLink;
	const label = usesCalendar || !whatsappLink ? copy.bookCall : copy.askWhatsApp;
	const Icon = usesCalendar || !whatsappLink ? Calendar : MessageCircle;

	return (
		<>
			{/* Sin borde propio: la lista de arriba ya trae el suyo y dos líneas
			    seguidas se leen como una tabla mal cerrada. */}
			<div className="mt-6 flex flex-wrap items-baseline gap-x-2">
				{priceFrom && (
					<span className="text-sm text-gray-400">{copy.priceFrom}</span>
				)}
				<span className="font-display text-2xl font-bold tracking-tight text-palette-lime">
					{priceLabel}
				</span>
				{/* "from $2,500 one-time" dice dos veces lo mismo: un precio con
				    "desde" ya es un proyecto, no una suscripción. El sufijo solo
				    aparece cuando agrega información. */}
				{pricePeriod === "month" ? (
					<span className="text-sm text-gray-400">{copy.pricePerMonth}</span>
				) : priceFrom ? null : (
					<span className="text-sm text-gray-500">{copy.priceOnce}</span>
				)}
			</div>

			<Button
				variant={usesCalendar ? "glass" : "green"}
				size="sm"
				asChild
				className="mt-5 w-full"
			>
				<a href={href} target="_blank" rel="noopener noreferrer">
					<Icon className="mr-2 h-4 w-4" />
					{label}
				</a>
			</Button>
		</>
	);
}

export default ServicePrice;
