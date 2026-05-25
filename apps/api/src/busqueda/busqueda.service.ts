import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import type { SearchQuery, SearchResult } from "@seres-del-pase/types";

@Injectable()
export class BusquedaService {
  private readonly prisma = new PrismaClient();
  private readonly openai: OpenAI;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({ apiKey: config.get("OPENAI_API_KEY") });
  }

  async buscar(query: SearchQuery): Promise<SearchResult[]> {
    const { q, tipo, limit = 10, offset = 0 } = query;

    if (!q.trim()) return [];

    // Fase 1: búsqueda full-text con tsvector de Postgres
    // Fase 2: complementar con búsqueda semántica por embedding
    const resultados = await this.busquedaFullText(q, tipo, limit, offset);

    return resultados;
  }

  private async busquedaFullText(
    q: string,
    tipos: SearchQuery["tipo"],
    limit: number,
    offset: number
  ): Promise<SearchResult[]> {
    // Búsqueda en personajes
    const personajes = await this.prisma.$queryRaw<SearchResult[]>`
      SELECT
        'personaje' AS tipo,
        id,
        slug,
        nombre,
        resumen,
        1.0 AS score,
        NULL AS "imagenPortada"
      FROM personajes
      WHERE
        "publicadoEn" IS NOT NULL
        AND (
          to_tsvector('spanish', nombre || ' ' || COALESCE("nombreKichwa", '') || ' ' || resumen)
          @@ plainto_tsquery('spanish', ${q})
        )
      ORDER BY nombre
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return personajes;
  }

  async generarEmbedding(texto: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texto,
    });

    return response.data[0]?.embedding ?? [];
  }

  async busquedaSemantica(
    embedding: number[],
    limit: number
  ): Promise<SearchResult[]> {
    // Requiere pgvector — disponible en Fase 2
    const vectorStr = `[${embedding.join(",")}]`;

    const resultados = await this.prisma.$queryRaw<SearchResult[]>`
      SELECT
        'personaje' AS tipo,
        id,
        slug,
        nombre,
        resumen,
        1 - (embedding <=> ${vectorStr}::vector) AS score,
        NULL AS "imagenPortada"
      FROM personajes
      WHERE embedding IS NOT NULL AND "publicadoEn" IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `;

    return resultados;
  }
}
