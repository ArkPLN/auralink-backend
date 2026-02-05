import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('社团管理系统 API')
    .setDescription('基于 NestJS 开发的内部社团管理系统接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/reference',
    apiReference({
      spec: {
        content: document,
      },
      theme: 'purple',
      pageTitle: '社团系统 API 文档',
    }),
  );

  await app.listen(3000);
  console.log('API 文档地址: http://localhost:3000/reference');
}
void bootstrap();
