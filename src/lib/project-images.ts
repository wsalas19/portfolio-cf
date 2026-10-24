import "server-only"; // el manifiesto se genera en build, no se bundlea al cliente.

import generated from "@/lib/generated/content.json";

// Un directorio por proyecto. El manifiesto se genera en build escaneando
// `public/images/projects/<slug>/`, así que agregar una captura sigue siendo
// copiar el archivo y reconstruir.
const galleries = generated.galleries as Record<string, string[]>;

export function galleryFor(slug: string): string[] {
	return galleries[slug] ?? [];
}
