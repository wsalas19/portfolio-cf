import { BlogPost } from "@/components/blog/BlogPost";
import { POLITICA_FECHA, POLITICA_VERSION } from "@/lib/legal";
import { LegalDoc } from "@/lib/legal/content";

// Misma tipografía y jerarquía que los posts del blog: el documento es Markdown
// y lo renderiza el mismo componente. lang="es" porque el <html> raíz es "en".
export function LegalDocument({ doc }: { doc: LegalDoc }) {
	return (
		<main lang="es" className="px-4 py-12 pb-40 md:px-8 lg:px-16">
			<div className="mx-auto max-w-4xl">
				<header className="mb-4">
					<h1 className="font-display text-4xl font-bold md:text-5xl text-white mb-4">
						{doc.title}
					</h1>
					<p className="text-sm text-gray-400">
						Versión {POLITICA_VERSION} · Vigente desde el {POLITICA_FECHA}
					</p>
				</header>

				<div className="glass mt-6 mb-8 rounded-lg p-4 text-xl text-gray-300">
					{doc.excerpt}
				</div>

				<BlogPost content={doc.content} />
			</div>
		</main>
	);
}
