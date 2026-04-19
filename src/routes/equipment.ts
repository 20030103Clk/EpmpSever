import { Router, Request, Response } from 'express';
import { query, execute } from '../utils/db';
import { ProdEquio, ApiResponse, PaginatedResult, PaginationParams } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;

    const totalResult = await query<any[]>(`SELECT COUNT(*) as total FROM prod_equio`);
    const total = totalResult[0].total;

    const sql = `SELECT * FROM prod_equio ORDER BY equioment_id DESC LIMIT ? OFFSET ?`;
    const rows = await query<ProdEquio[]>(sql, [pageSizeNum.toString(), offset.toString()]);

    const result: PaginatedResult<ProdEquio> = {
      list: rows,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    };

    const response: ApiResponse<PaginatedResult<ProdEquio>> = {
      success: true,
      message: 'success',
      data: result
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch equipment list',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM prod_equio WHERE equioment_id = ?`;
    const rows = await query<ProdEquio[]>(sql, [id]);

    if (rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Equipment not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ProdEquio> = {
      success: true,
      message: 'success',
      data: rows[0]
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch equipment',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { statusText, equio, status } = req.body;

    if (!equio || !status) {
      const response: ApiResponse = {
        success: false,
        message: 'Equipment name and status are required',
        code: 400
      };
      return res.status(400).json(response);
    }

    const sql = `INSERT INTO prod_equio (statusText, equio, status) VALUES (?, ?, ?)`;
    const result = await execute(sql, [statusText || '', equio, status]);

    const response: ApiResponse<{ insertId: number }> = {
      success: true,
      message: 'Equipment created successfully',
      data: { insertId: result.insertId }
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create equipment',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { statusText, equio, status } = req.body;

    const checkSql = `SELECT * FROM prod_equio WHERE equioment_id = ?`;
    const existing = await query<ProdEquio[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Equipment not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const sql = `UPDATE prod_equio SET statusText = ?, equio = ?, status = ? WHERE equioment_id = ?`;
    await execute(sql, [statusText ?? existing[0].statusText, equio ?? existing[0].equio, status ?? existing[0].status, id]);

    const response: ApiResponse = {
      success: true,
      message: 'Equipment updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update equipment',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const checkSql = `SELECT * FROM prod_equio WHERE equioment_id = ?`;
    const existing = await query<ProdEquio[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Equipment not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const sql = `DELETE FROM prod_equio WHERE equioment_id = ?`;
    await execute(sql, [id]);

    const response: ApiResponse = {
      success: true,
      message: 'Equipment deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete equipment',
      code: 500
    };
    res.status(500).json(response);
  }
});

export default router;