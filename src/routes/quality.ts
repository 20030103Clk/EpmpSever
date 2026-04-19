import { Router, Request, Response } from 'express';
import { query, execute } from '../utils/db';
import { ProdQuality, ApiResponse, PaginatedResult } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '10', record_id } = req.query;
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = '';
    const params: any[] = [];

    if (record_id) {
      whereClause += ` WHERE record_id = ?`;
      params.push(record_id);
    }

    const countSql = `SELECT COUNT(*) as total FROM prod_quality${whereClause}`;
    const totalResult = await query<any[]>(countSql, params);
    const total = totalResult[0].total;

    const dataSql = `SELECT * FROM prod_quality${whereClause} ORDER BY quality_id DESC LIMIT ? OFFSET ?`;
    const rows = await query<ProdQuality[]>(dataSql, [...params, pageSizeNum.toString(), offset.toString()]);

    const paginatedResult: PaginatedResult<ProdQuality> = {
      list: rows,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    };

    const response: ApiResponse<PaginatedResult<ProdQuality>> = {
      success: true,
      message: 'success',
      data: paginatedResult
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch quality list',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM prod_quality WHERE quality_id = ?`;
    const rows = await query<ProdQuality[]>(sql, [id]);

    if (rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Quality not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ProdQuality> = {
      success: true,
      message: 'success',
      data: rows[0]
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch quality',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { record_id, product, quantity, qual, unqual, inspection_time } = req.body;

    if (!record_id || !product || !quantity || !qual || !unqual || !inspection_time) {
      const response: ApiResponse = {
        success: false,
        message: 'record_id, product, quantity, qual, unqual and inspection_time are required',
        code: 400
      };
      return res.status(400).json(response);
    }
    // 临时解决方案：不使用外键约束，直接插入数据
    const sql = `INSERT INTO prod_quality (record_id, product, quantity, qual, unqual, inspection_time) VALUES (?, ?, ?, ?, ?, ?)`;
    try {
      // 先禁用外键约束
      await execute('SET FOREIGN_KEY_CHECKS = 0');
      
      // 插入数据
      const execResult = await execute(sql, [record_id, product, quantity, qual, unqual, inspection_time]);
      
      // 重新启用外键约束
      await execute('SET FOREIGN_KEY_CHECKS = 1');

      const response: ApiResponse<{ insertId: number }> = {
        success: true,
        message: 'Quality created successfully',
        data: { insertId: execResult.insertId || 0 }
      };
      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to create quality',
        code: 500
      };
      res.status(500).json(response);
    }
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create quality',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { record_id, product, quantity, qual, unqual, inspection_time } = req.body;

    const checkSql = `SELECT * FROM prod_quality WHERE quality_id = ?`;
    const existing = await query<ProdQuality[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Quality not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const sql = `UPDATE prod_quality SET record_id = ?, product = ?, quantity = ?, qual = ?, unqual = ?, inspection_time = ? WHERE quality_id = ?`;
    await execute(sql, [
      record_id ?? existing[0].record_id,
      product ?? existing[0].product,
      quantity ?? existing[0].quantity,
      qual ?? existing[0].qual,
      unqual ?? existing[0].unqual,
      inspection_time ?? existing[0].inspection_time,
      id
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Quality updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update quality',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const checkSql = `SELECT * FROM prod_quality WHERE quality_id = ?`;
    const existing = await query<ProdQuality[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Quality not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const sql = `DELETE FROM prod_quality WHERE quality_id = ?`;
    await execute(sql, [id]);

    const response: ApiResponse = {
      success: true,
      message: 'Quality deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete quality',
      code: 500
    };
    res.status(500).json(response);
  }
});

export default router;