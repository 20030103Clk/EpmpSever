import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

import equipmentRoutes from './routes/equipment';
import inventoryRoutes from './routes/inventory';
import planRoutes from './routes/plan';
import userRoutes from './routes/user';
import recordRoutes from './routes/record';
import qualityRoutes from './routes/quality';
import statisticsRouter from './routes/statistics';

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// 设置编码为 UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/api', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Production Management API Server',
    version: '1.0.0',
    endpoints: {
      equipment: '/api/equipment',
      inventory: '/api/inventory',
      plan: '/api/plan',
      user: '/api/user',
      record: '/api/record',
      quality: '/api/quality'
    }
  });
});

app.use('/api/equipment', equipmentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/user', userRoutes);
app.use('/api/record', recordRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/statistics', statisticsRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 500
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    code: 404
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API documentation: http://localhost:${PORT}/api`);
});

export default app;