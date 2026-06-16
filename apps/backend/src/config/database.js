import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  multipleStatements: true,
});

export const ensureDatabaseExists = async () => {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }
};

export const connectDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
  } catch (error) {
    console.error(
      `Khong the ket noi MySQL tai ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME} voi user "${env.DB_USER}". Hay kiem tra DB_USER va DB_PASSWORD trong .env.`,
    );
    throw error;
  }
};

export const disconnectDatabase = async () => {
  await pool.end();
};

export const query = async (sql, params = []) => {
  const [rows] = params.length > 0 ? await pool.execute(sql, params) : await pool.query(sql);
  return rows;
};

export const transaction = async (handler) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
