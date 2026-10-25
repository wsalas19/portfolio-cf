"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CONTACT_EMAIL } from "@/lib/constants";
import { POLITICA_VERSION } from "@/lib/legal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { Turnstile } from "./Turnstile";

import type { LandingCopy } from "@/lib/i18n";

// Los mensajes de validación son prosa, así que el esquema se arma con el copy
// del idioma en vez de ser una constante de módulo. El precio es reconstruirlo
// en cada render, y son cinco `z.string()`: no vale la pena memoizarlo.
function buildFormSchema(copy: LandingCopy) {
	return z.object({
		name: z.string().min(2, copy.contact.nameError),
		email: z.string().email(copy.contact.emailError),
		title: z.string().min(3, copy.contact.subjectError),
		message: z.string().min(10, copy.contact.messageError),
		// Ley 1581/2012 art. 9: la autorización debe ser previa y expresa, así que la
		// casilla nunca va premarcada y el silencio no vale como consentimiento.
		consent: z.boolean().refine((v) => v, copy.contact.consentError),
	});
}

function ContactForm({ copy }: { copy: LandingCopy }) {
	const { toast } = useToast();
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [turnstileKey, setTurnstileKey] = useState(0);
	const formSchema = buildFormSchema(copy);
	const form = useForm<z.infer<ReturnType<typeof buildFormSchema>>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			email: "",
			title: "",
			message: "",
			consent: false,
		},
	});

	const {
		formState: { isSubmitting, errors },
	} = form;

	async function onSubmit(values: z.infer<typeof formSchema>) {
		if (!turnstileToken) {
			toast({
				title: copy.contact.errorTitle,
				description: copy.contact.errorBody,
				variant: "destructive",
			});
			return;
		}

		try {
			const response = await fetch("/api/email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...values,
					turnstileToken,
					// Evidencia de la autorización: qué versión aceptó. El sello de
					// tiempo lo pone el servidor, no el cliente.
					policyVersion: POLITICA_VERSION,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to send email");
			}

			form.reset();
			setTurnstileToken(null);
			setTurnstileKey((key) => key + 1);
			toast({
				title: copy.contact.thanks.replace("{name}", values.name),
				description: copy.contact.thanksBody,
				variant: "success",
				duration: 2500,
			});
		} catch (error) {
			setTurnstileToken(null);
			setTurnstileKey((key) => key + 1);
			toast({
				title: copy.contact.errorTitle,
				description: copy.contact.errorBody,
				variant: "destructive",
			});
			console.error("Error sending email:", error);
		}
	}


	return (
		<div
			id="contact"
			className="py-20 md:py-32"
		>
			<div className="container-page">
				{/* Single Unified Card */}
				<div className="glass-strong rise [--rise-delay:200ms] rounded-2xl border border-white/10 shadow-2xl overflow-hidden glow-pink-hover">
					<div className="grid lg:grid-cols-2">
						{/* Left Section - Contact Info */}
						<div
							className="p-8 lg:p-12 rise [--rise-delay:400ms] bg-gradient-to-br from-palette-pink/10 to-transparent
	                         border-r border-white/10 lg:border-r lg:border-b-0 border-b"
						>
							<h3 className="font-display text-2xl font-bold mb-6 text-gradient-pink">
								{copy.contact.heading}
							</h3>

							<div className="space-y-6 mb-8">
								<div className="flex items-center gap-4">
									<div className="p-3 glass-pink rounded-full glow-pink-hover">
										<Mail className="w-6 h-6 text-palette-pink" />
									</div>
									<div>
										<p className="text-white font-bold text-sm">
											{copy.contact.emailLabel}
										</p>
										<p className="text-white font-medium">
											{CONTACT_EMAIL}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="p-3 glass-pink rounded-full glow-pink-hover">
										<MessageSquare className="w-6 h-6 text-palette-pink" />
									</div>
									<div>
										<p className="text-white font-bold text-sm">
											{copy.contact.responseTimeLabel}
										</p>
										<p className="text-white font-medium">
											{copy.contact.responseTimeValue}
										</p>
									</div>
								</div>
							</div>

							<div className="p-6 glass-pink rounded-xl border border-palette-pink/30">
								<h4 className="text-white font-semibold mb-2">
									{copy.contact.pitchTitle}
								</h4>
								<p className="text-gray-300 text-sm leading-relaxed">
									{copy.contact.pitchBody}
								</p>
							</div>
						</div>

						{/* Right Section - Contact Form */}
						<div className="p-8 lg:p-12 rise [--rise-delay:400ms]">
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-4"
							>
								{/* Name and Email Row */}
								<div className="grid md:grid-cols-2 gap-6">
									<div className="rise [--rise-delay:500ms]">
										<Label
											htmlFor="name"
											className="flex items-center gap-2  mb-2 font-bold text-base"
										>
											{copy.contact.nameLabel}
										</Label>
										<Input
											id="name"
											placeholder={copy.contact.namePlaceholder}
											className="glass-subtle border-white/10 focus:border-palette-lime focus:ring-1 focus:ring-palette-lime
	                                     transition-[border-color,box-shadow] duration-300  placeholder:text-gray-400 rounded-lg"
											{...form.register("name")}
											aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined}
										/>
										{errors.name && (
											<p role="alert" id="name-error" className="text-red-400 text-sm mt-2">
												{errors.name.message}
											</p>
										)}
									</div>

									<div className="rise [--rise-delay:600ms]">
										<Label
											htmlFor="email"
											className="flex items-center gap-2  mb-2 font-bold text-base"
										>
											{copy.contact.emailFieldLabel}
										</Label>
										<Input
											id="email"
											placeholder={copy.contact.emailPlaceholder}
											type="email"
											className="glass-subtle border-white/10 focus:border-palette-lime focus:ring-1 focus:ring-palette-lime
	                                     transition-[border-color,box-shadow] duration-300  placeholder:text-gray-400 rounded-lg"
											{...form.register("email")}
											aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined}
										/>
										{errors.email && (
											<p role="alert" id="email-error" className="text-red-400 text-sm mt-2">
												{errors.email.message}
											</p>
										)}
									</div>
								</div>

								{/* Subject */}
								<div className="rise [--rise-delay:700ms]">
									<Label
										htmlFor="title"
										className="flex items-center gap-2  mb-2 font-bold text-base"
									>
										{copy.contact.subjectLabel}
									</Label>
									<Input
										id="title"
										placeholder={copy.contact.subjectPlaceholder}
										className="glass-subtle border-white/10 focus:border-palette-lime focus:ring-1 focus:ring-palette-lime
	                                 transition-[border-color,box-shadow] duration-300  placeholder:text-gray-400 rounded-lg"
										{...form.register("title")}
										aria-invalid={!!errors.title} aria-describedby={errors.title ? "title-error" : undefined}
									/>
									{errors.title && (
										<p role="alert" id="title-error" className="text-red-400 text-sm mt-2">
											{errors.title.message}
										</p>
									)}
								</div>

								{/* Message */}
								<div className="rise [--rise-delay:800ms]">
									<Label
										htmlFor="message"
										className="flex items-center gap-2 mb-2 font-bold text-base"
									>
										{copy.contact.messageLabel}
									</Label>
									<Textarea
										id="message"
										placeholder={copy.contact.messagePlaceholder}
										className="glass-subtle border-white/10 focus:border-palette-lime focus:ring-1 focus:ring-palette-lime
	                                 transition-[border-color,box-shadow] duration-300 min-h-[120px] placeholder:text-gray-400
	                                 resize-none rounded-lg"
										{...form.register("message")}
										aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : undefined}
									/>
									{errors.message && (
										<p role="alert" id="message-error" className="text-red-400 text-sm mt-2">
											{errors.message.message}
										</p>
									)}
								</div>

								{/* Consentimiento informado previo al envío */}
								<div className="rise [--rise-delay:900ms]">
									<label className="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											{...form.register("consent")}
											aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "consent-error" : undefined}
											// `border-white/20` y `bg-transparent` no aplican: en un checkbox
											// nativo (appearance: auto) los ignora el navegador. El color
											// lo pone `accent-palette-lime` y el resto `color-scheme: dark`.
											className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-palette-lime"
										/>
										<span className="text-xs leading-relaxed text-gray-400">
											{copy.contact.consentPrefix}{" "}
											<Link
												href="/privacidad"
												target="_blank"
												className="text-palette-lime underline decoration-white/20 transition-colors hover:text-palette-olive"
											>
												{copy.contact.consentLink}
											</Link>
											.
										</span>
									</label>
									{errors.consent && (
										<p role="alert" id="consent-error" className="text-red-400 text-sm mt-2">
											{errors.consent.message}
										</p>
									)}
								</div>

								{/* Turnstile: verifica el envío antes de llegar al endpoint. */}
								<div className="rise [--rise-delay:950ms]">
									<Turnstile key={turnstileKey} onToken={setTurnstileToken} />
								</div>

								{/* Submit Button */}
								<div className="rise [--rise-delay:1000ms]">
									<Button
										variant={"green"}
										className="w-full text-[16px] glow-lime-hover"
										type="submit"
										disabled={isSubmitting || !turnstileToken}
									>
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 h-5 w-5 animate-spin" />
												{copy.contact.sending}
											</>
										) : (
											<>
												<Send className="mr-2 h-5 w-5" />
												{copy.contact.send}
											</>
										)}
									</Button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ContactForm;
