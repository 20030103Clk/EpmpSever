import { Router, Request, Response } from 'express';
import { query, execute } from '../utils/db';
import { ProdInventory, ApiResponse, PaginatedResult } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;

    const totalResult = await query<any[]>(`SELECT COUNT(*) as total FROM prod_inventory`);
    const total = totalResult[0].total;

    const sql = `SELECT * FROM prod_inventory ORDER BY inventory_id DESC LIMIT ? OFFSET ?`;
    const rows = await query<ProdInventory[]>(sql, [pageSizeNum.toString(), offset.toString()]);

    const result: PaginatedResult<ProdInventory> = {
      list: rows,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    };

    const response: ApiResponse<PaginatedResult<ProdInventory>> = {
      success: true,
      message: 'success',
      data: result
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch inventory list',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM prod_inventory WHERE inventory_id = ?`;
    const rows = await query<ProdInventory[]>(sql, [id]);

    if (rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Inventory not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ProdInventory> = {
      success: true,
      message: 'success',
      data: rows[0]
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch inventory',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { product, code, currentStock, safeStock, unit, location } = req.body;

    if (!product || !code || currentStock === undefined || !location) {
      const response: ApiResponse = {
        success: false,
        message: 'Product, code, currentStock and location are required',
        code: 400
      };
      return res.status(400).json(response);
    }

    const sql = `INSERT INTO prod_inventory (product, code, currentStock, safeStock, unit, location) VALUES (?, ?, ?, ?, ?, ?)`;
    const result = await execute(sql, [product, code, currentStock, safeStock || 0, unit || null, location]);

    const response: ApiResponse<{ insertId: number }> = {
      success: true,
      message: 'Inventory created successfully',
      data: { insertId: result.insertId }
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create inventory',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { product, code, currentStock, safeStock, unit, location } = req.body;

    const checkSql = `SELECT * FROM prod_inventory WHERE inventory_id = ?`;
    const existing = await query<ProdInventory[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Inventory not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const sql = `UPDATE prod_inventory SET product = ?, code = ?, currentStock = ?, safeStock = ?, unit = ?, location = ? WHERE inventory_id = ?`;
    await execute(sql, [
      product ?? existing[0].product,
      code ?? existing[0].code,
      currentStock ?? existing[0].currentStock,
      safeStock ?? existing[0].safeStock,
      unit ?? existing[0].unit,
      location ?? existing[0].location,
      id
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Inventory updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update inventory',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const checkSql = `SELECT * FROM prod_inventory WHERE inventory_id = ?`;
    const existing = await query<ProdInventory[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Inventory not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const sql = `DELETE FROM prod_inventory WHERE inventory_id = ?`;
    await execute(sql, [id]);

    const response: ApiResponse = {
      success: true,
      message: 'Inventory deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete inventory',
      code: 500
    };
    res.status(500).json(response);
  }
});

export default router;