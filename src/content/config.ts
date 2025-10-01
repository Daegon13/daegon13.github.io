import { defineCollection, z } from 'astro:content';

const proyectos = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    // slug: z.string(), // <- quitar
    sector: z.string(),
    rol: z.string(),
    stack: z.array(z.string()),
    fecha: z.string(),        // "YYYY-MM"
    resumen: z.string(),
    problema: z.string(),
    solucion: z.string(),
    resultado: z.string().optional(),
    repoUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    cover: z.string().optional()
  })
});

export const collections = { proyectos };

