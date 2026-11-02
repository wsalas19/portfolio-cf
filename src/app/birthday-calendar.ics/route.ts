// Feed de suscripción de cumpleaños. El .ics se inyecta en tiempo de build
// (`?raw`), así que la ruta no depende de `fs`, que no existe en Workers.
// Se sirve con el Content-Type exacto que las apps de calendario necesitan para
// tratarlo como feed en vivo en lugar de descargarlo como adjunto.
import ics from "../../lib/calendar/birthday-calendar.ics?raw";

// Se responde en cada petición en lugar de prerenderizar la ruta: un asset
// estático se serviría con el MIME derivado de la extensión (text/calendar sin
// `charset`), perdiendo el header exacto que pedimos aquí.
export const dynamic = "force-dynamic";

export function GET() {
	return new Response(ics, {
		status: 200,
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": 'inline; filename="birthday-calendar.ics"',
			"Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
		},
	});
}
