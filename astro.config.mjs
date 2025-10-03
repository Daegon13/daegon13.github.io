// Configuración de Astro
// - Tailwind para estilos utilitarios
// - MDX para escribir casos en formato Markdown con JSX si hiciera falta
// - Sitemap para SEO técnico básico
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://daegon13.github.io', // TODO: reemplazar cuando tengas dominio
  integrations: [tailwind(), mdx(), sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-dark' } // resaltado de código legible
  }
});
