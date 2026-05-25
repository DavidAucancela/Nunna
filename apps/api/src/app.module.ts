import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BusquedaModule } from "./busqueda/busqueda.module";
import { WebhooksModule } from "./webhooks/webhooks.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    BusquedaModule,
    WebhooksModule,
  ],
})
export class AppModule {}
