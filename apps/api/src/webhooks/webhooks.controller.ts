import { Controller, Post, Body, Headers, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

interface DirectusWebhookPayload {
  event: string;
  collection: string;
  key?: string | number;
}

@ApiTags("Webhooks")
@Controller("webhooks")
export class WebhooksController {
  constructor(private config: ConfigService) {}

  @Post("directus")
  @ApiOperation({ summary: "Recibe eventos de Directus para invalidar caché de Next.js" })
  async handleDirectusEvent(
    @Body() payload: DirectusWebhookPayload,
    @Headers("x-webhook-secret") secret: string
  ) {
    const expectedSecret = this.config.get<string>("WEBHOOK_SECRET");

    if (!expectedSecret || secret !== expectedSecret) {
      throw new UnauthorizedException("Webhook secret inválido");
    }

    const revalidateUrl = this.config.get<string>("NEXT_REVALIDATE_URL");
    const revalidateToken = this.config.get<string>("NEXT_REVALIDATE_TOKEN");

    if (!revalidateUrl || !revalidateToken) return { ok: true };

    // Invalida el path correspondiente en Next.js on-demand revalidation
    const paths = this.getPathsToRevalidate(payload.collection, payload.key);

    await Promise.all(
      paths.map((path) =>
        fetch(`${revalidateUrl}/api/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, token: revalidateToken }),
        })
      )
    );

    return { ok: true, revalidated: paths };
  }

  private getPathsToRevalidate(
    collection: string,
    key?: string | number
  ): string[] {
    switch (collection) {
      case "personajes":
        return key ? [`/es/personajes/${key}`, `/en/personajes/${key}`] : ["/es/personajes"];
      case "pases":
        return key ? [`/es/pases/${key}`] : ["/es/pases"];
      default:
        return [];
    }
  }
}
