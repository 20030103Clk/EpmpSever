import { Router, Request, Response } from 'express';
import { execute } from '../utils/db';

const router = Router();

// 获取生产统计数据
router.get('/', async (req: Request, res: Response) => {
  try {
    // 获取最近7天的产量数据
    const yieldData = await execute(`
      SELECT DATE(date) as date, SUM(output) as output 
      FROM prod_record 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
      GROUP BY DATE(date) 
      ORDER BY date
    `);

    // 获取各产品的合格率
    const qualityData = await execute(`
      SELECT product, 
             SUM(qual) as qualified, 
             SUM(output) as total,
             (SUM(qual) / SUM(output) * 100) as rate
      FROM prod_record 
      GROUP BY product
    `);

    // 模拟设备状态数据
    const deviceData = [
      { status: '运行中', count: 8 },
      { status: '待机', count: 2 },
      { status: '故障', count: 1 }
    ];

    res.json({
      success: true,
      message: 'success',
      data: {
        yieldData,
        qualityData,
        deviceData
      }
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      code: 500
    });
  }
});

export default router;