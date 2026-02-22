import { MikroORM } from '@mikro-orm/core';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const getEnv = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

async function testConnection() {
  try {
    console.log('正在测试MikroORM数据库连接...');
    console.log('连接参数:');
    console.log(`  - 主机: ${getEnv('DB_HOST', 'localhost')}`);
    console.log(`  - 端口: ${getEnvNumber('DB_PORT', 5432)}`);
    console.log(`  - 数据库: ${getEnv('DB_DATABASE', 'postgres')}`);
    console.log(`  - 用户名: ${getEnv('DB_USERNAME', 'postgres')}`);

    const orm = await MikroORM.init({
      dbName: getEnv('DB_DATABASE', 'postgres'),
      host: getEnv('DB_HOST', 'localhost'),
      port: getEnvNumber('DB_PORT', 5432),
      user: getEnv('DB_USERNAME', 'postgres'),
      password: getEnv('DB_PASSWORD', 'pgsql'),
      entities: ['dist/**/*.entity.js'],
      entitiesTs: ['src/**/*.entity.ts'],
    });

    console.log('✅ 数据库连接成功！');

    const connection = orm.em.getConnection();
    const result = await connection.execute('SELECT version()');
    console.log('数据库版本:', result[0].version);

    await orm.close();
    console.log('✅ 连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error(error);
    process.exit(1);
  }
}

void testConnection();
