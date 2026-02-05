import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference'; // 引入 Scalar

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. 配置 OpenAPI (Swagger) 基本信息
  const config = new DocumentBuilder()
    .setTitle('社团管理系统 API')
    .setDescription('基于 NestJS 开发的内部社团管理系统接口文档')
    .setVersion('1.0')
    // 开启 Bearer Auth (JWT 认证功能)，会在文档中显示“锁”图标
    .addBearerAuth()
    .build();

  // 2. 生成文档数据
  const document = SwaggerModule.createDocument(app, config);

  // 3. 挂载 Scalar API 文档
  // 访问路径: http://localhost:3000/reference
  app.use(
    '/reference',
    apiReference({
      spec: {
        content: document, // 将生成的文档传给 Scalar
      },
      // 自定义主题，可选值: 'alternate', 'default', 'moon', 'purple', 'solarized'
      theme: 'purple',
      // 页面标题
      pageTitle: '社团系统 API 文档',
    }),
  );

  await app.listen(3000);
  console.log('API 文档地址: http://localhost:3000/reference');
}
bootstrap();
