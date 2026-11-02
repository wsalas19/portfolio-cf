// Vite permite importar el contenido crudo de cualquier archivo con el sufijo
// `?raw`. La declaración cubre los imports de assets (p. ej. el feed .ics) sin
// depender de `fs`, que no existe en el runtime de Cloudflare Workers.
declare module "*?raw" {
	const content: string;
	export default content;
}
