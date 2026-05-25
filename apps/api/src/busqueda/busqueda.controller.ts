import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { BusquedaService } from "./busqueda.service";
import type { SearchQuery } from "@seres-del-pase/types";

@ApiTags("Búsqueda")
@Controller("busqueda")
export class BusquedaController {
  constructor(private readonly busquedaService: BusquedaService) {}

  @Get()
  @ApiOperation({ summary: "Búsqueda híbrida (full-text + semántica en Fase 2)" })
  @ApiQuery({ name: "q", required: true, description: "Término de búsqueda" })
  @ApiQuery({ name: "tipo", required: false, enum: ["personaje", "pase", "elemento", "glosario"] })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async buscar(
    @Query("q") q: string,
    @Query("tipo") tipo?: SearchQuery["tipo"],
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.busquedaService.buscar({ q, tipo, limit, offset });
  }
}
