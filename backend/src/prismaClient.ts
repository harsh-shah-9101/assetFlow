import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const url = new URL(databaseUrl.replace(/^mysql:/, 'http:'));
const connectionConfig = {
  host: url.hostname,
  port: url.port ? parseInt(url.port) : 3306,
  user: url.username || 'root',
  password: url.password || '',
  database: url.pathname.replace(/^\//, '')
};

const adapter = new PrismaMariaDb(connectionConfig);
const prisma = new PrismaClient({ adapter });

export default prisma;
