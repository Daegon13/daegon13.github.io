// src/lib/contact.ts
// Contact constants + helpers (no extra deps)
export const SITE_URL = "https://daegon13.github.io";
export const EMAIL = "damgmarin13@gmail.com";

export const LINKEDIN_URL = "https://www.linkedin.com/in/diego-marin-34632121b/";
export const GITHUB_URL = "https://github.com/Daegon13";

export const WHATSAPP_NUMBER_E164 = "59897316092"; // UY (+598) + 97316092
export const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER_E164}`;

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hola Diego, soy [Nombre]. Tengo un negocio de [Rubro]. Quiero lograr [Objetivo: más consultas / reservas / ventas]. Hoy tengo [web/no web]. Presupuesto estimado: [USD].";

export function waLink(text?: string) {
  const msg = (text ?? DEFAULT_WHATSAPP_MESSAGE).trim();
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(msg)}`;
}
