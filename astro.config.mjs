// astro.config.mjs
// -----------------
// Config base del sitio + integraciones necesarias
import { defineConfig } from 'astro/config';
// 1) Tailwind para generar las utilidades CSS
import tailwind from '@astrojs/tailwind';
// 2) MDX porque estás usando .mdx en /src/content/proyectos
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // URL pública del sitio (correcta para user/org pages)
  site: 'https://daegon13.github.io',
  // 3) Registro de integraciones (sin esto no compila el CSS de Tailwind ni los MDX)
  integrations: [
    tailwind({
      // Opcional: estilos base de Tailwind (normaliza tipografías)
      applyBaseStyles: true,
    }),
    mdx(),
    sitemap(),
  ],
});
