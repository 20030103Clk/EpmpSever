import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const pool: Pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Clk20030103',
  database: 'epmpdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '+08:00'
});

// 测试数据库连接
console.log('Attempting to connect to database...');
pool.getConnection()
  .then(connection => {
    console.log('Database connection successful');
    connection.release();
  })
  .catch(error => {
    console.error('Database connection error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  });

export const getConnection = async (): Promise<PoolConnection> => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
};

export const query = async <T extends RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<T> => {
  try {
    const [rows] = await pool.execute<T>(sql, params);
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

export const execute = async (
  sql: string,
  params?: any[]
): Promise<any> => {
  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error('Error executing statement:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

export const transaction = async <T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('Error in transaction:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export default pool;