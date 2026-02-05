import { DataSource } from 'typeorm';
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

interface DataSourceOptions {
  host: string;
  port: number;
  database: string;
  username: string;
}

const dataSource = new DataSource({
  type: 'postgres',
  host: getEnv('DB_HOST', 'localhost'),
  port: getEnvNumber('DB_PORT', 5432),
  username: getEnv('DB_USERNAME', 'postgres'),
  password: getEnv('DB_PASSWORD', 'pgsql'),
  database: getEnv('DB_DATABASE', 'postgres'),
});

interface DatabaseVersionResult {
  version: string;
}

async function testConnection() {
  try {
    console.log('正在测试TypeORM数据库连接...');
    const options = dataSource.options as unknown as DataSourceOptions;
    console.log('连接参数:');
    console.log(`  - 主机: ${options.host}`);
    console.log(`  - 端口: ${options.port}`);
    console.log(`  - 数据库: ${options.database}`);
    console.log(`  - 用户名: ${options.username}`);

    await dataSource.initialize();
    console.log('✅ 数据库连接成功！');

    const databaseVersion =
      await dataSource.query<DatabaseVersionResult[]>('SELECT version()');
    const versionInfo = databaseVersion[0];
    console.log('数据库版本:', versionInfo.version);

    await dataSource.destroy();
    console.log('✅ 连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error(error);
    process.exit(1);
  }
}

void testConnection();
