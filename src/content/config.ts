// Define la colección "proyectos" con frontmatter validado
import { defineCollection, z } from 'astro:content';

const proyectos = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),              // Título legible
    slug: z.string(),               // Para URL amigable
    sector: z.string(),             // Rubro del cliente
    rol: z.string(),                // Rol principal (dev frontend, fullstack, etc.)
    stack: z.array(z.string()),     // Tecnologías usadas
    fecha: z.string(),              // "YYYY-MM"
    resumen: z.string(),            // 1-2 líneas intro
    problema: z.string(),           // Problema del cliente
    solucion: z.string(),           // Qué hiciste
    resultado: z.string().optional(), // Métrica/resultado si aplica
    repoUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    cover: z.string().optional()    // Ruta a imagen de portada
  })
});

export const collections = { proyectos };
