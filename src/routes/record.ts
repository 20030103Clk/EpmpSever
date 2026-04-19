import { Router, Request, Response } from 'express';
import { query, execute, transaction } from '../utils/db';
import { ProdRecord, ApiResponse, PaginatedResult } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '10', plan_id, name, product, equio, date } = req.query;
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = '';
    const params: any[] = [];

    if (plan_id) {
      whereClause += ` WHERE plan_id = ?`;
      params.push(plan_id);
    }

    if (name) {
      whereClause += whereClause ? ` AND name = ?` : ` WHERE name = ?`;
      params.push(name);
    }

    if (product) {
      whereClause += whereClause ? ` AND product LIKE ?` : ` WHERE product LIKE ?`;
      params.push(`%${product}%`);
    }

    if (equio && typeof equio === 'string' && equio.trim()) {
      whereClause += whereClause ? ` AND equio = ?` : ` WHERE equio = ?`;
      params.push(equio);
    }

    if (date) {
      whereClause += whereClause ? ` AND date = ?` : ` WHERE date = ?`;
      params.push(date);
    }

    const countSql = `SELECT COUNT(*) as total FROM prod_record${whereClause}`;
    const totalResult = await query<any[]>(countSql, params);
    const total = totalResult[0].total;

    const dataSql = `SELECT * FROM prod_record${whereClause} ORDER BY record_id DESC LIMIT ? OFFSET ?`;
    const rows = await query<ProdRecord[]>(dataSql, [...params, pageSizeNum.toString(), offset.toString()]);

    const result: PaginatedResult<ProdRecord> = {
      list: rows,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    };

    const response: ApiResponse<PaginatedResult<ProdRecord>> = {
      success: true,
      message: 'success',
      data: result
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch record list',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM prod_record WHERE record_id = ?`;
    const rows = await query<ProdRecord[]>(sql, [id]);

    if (rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Record not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ProdRecord> = {
      success: true,
      message: 'success',
      data: rows[0]
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch record',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { plan_id, product, output, unqual, qual, equio, date, name, md } = req.body;

    if (!plan_id || !product || output === undefined || !equio || !date || !name) {
      const response: ApiResponse = {
        success: false,
        message: 'plan_id, product, output, equio, date and name are required',
        code: 400
      };
      return res.status(400).json(response);
    }

    const sql = `INSERT INTO prod_record (plan_id, product, output, unqual, qual, equio, date, name, md) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const result = await execute(sql, [plan_id, product, output, unqual || 0, qual || 0, equio, date, name, md || null]);

    const response: ApiResponse<{ insertId: number }> = {
      success: true,
      message: 'Record created successfully',
      data: { insertId: result.insertId }
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create record',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { plan_id, product, output, unqual, qual, equio, date, name, md } = req.body;

    const checkSql = `SELECT * FROM prod_record WHERE record_id = ?`;
    const existing = await query<ProdRecord[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Record not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const sql = `UPDATE prod_record SET plan_id = ?, product = ?, output = ?, unqual = ?, qual = ?, equio = ?, date = ?, name = ?, md = ? WHERE record_id = ?`;
    await execute(sql, [
      plan_id ?? existing[0].plan_id,
      product ?? existing[0].product,
      output ?? existing[0].output,
      unqual ?? existing[0].unqual,
      qual ?? existing[0].qual,
      equio ?? existing[0].equio,
      date ?? existing[0].date,
      name ?? existing[0].name,
      md ?? existing[0].md,
      id
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Record updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update record',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const checkSql = `SELECT * FROM prod_record WHERE record_id = ?`;
    const existing = await query<ProdRecord[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Record not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const sql = `DELETE FROM prod_record WHERE record_id = ?`;
    await execute(sql, [id]);

    const response: ApiResponse = {
      success: true,
      message: 'Record deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete record',
      code: 500
    };
    res.status(500).json(response);
  }
});

export default router;