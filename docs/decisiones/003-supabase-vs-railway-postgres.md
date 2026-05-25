# ADR-003: Supabase para PostgreSQL en lugar de Railway Postgres

**Estado:** Aceptado  
**Fecha:** 2026-05-25

## Contexto

El plan original mencionaba tanto Supabase como Railway como opciones para la base de datos.

## Decisión

Usar **Supabase** para PostgreSQL + Storage.

## Razones

1. **pgvector incluido** — se activa con `CREATE EXTENSION IF NOT EXISTS vector;` en el SQL editor
2. **Storage integrado** — imágenes y audios de personajes van directo a Supabase Storage sin servicio adicional
3. **Free tier real** — 500MB DB + 1GB Storage, suficiente para Fase 1 completa
4. **Dashboard visual** — revisar datos y correr SQL sin instalar nada
5. **Railway sigue para Directus + NestJS** — cada servicio en lo que hace mejor

## Arquitectura resultante

```
Supabase → PostgreSQL + pgvector + Storage
Railway  → Directus (CMS) + Next.js (frontend) + NestJS API
```

> Actualizado 2026-05-25: frontend migrado de Vercel a Railway para centralizar infraestructura.
