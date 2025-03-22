import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { configs } from '@utils/configs'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const options = new DocumentBuilder().setTitle('Social App API').addBearerAuth().setVersion('1.0').build()
  const document = SwaggerModule.createDocument(app, options)

  SwaggerModule.setup('docs', app, document)

  await app.listen(configs.port)
}
bootstrap()
