import { Router, Request, Response } from 'express';
import { query, execute, transaction } from '../utils/db';
import { ProdPlan, ApiResponse, PaginatedResult } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '10', status } = req.query;
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;

    let countSql = `SELECT COUNT(*) as total FROM prod_plan`;
    let dataSql = `SELECT * FROM prod_plan`;
    const params: any[] = [];

    if (status) {
      countSql += ` WHERE status = ?`;
      dataSql += ` WHERE status = ?`;
      params.push(status);
    }

    dataSql += ` ORDER BY plan_id DESC LIMIT ? OFFSET ?`;

    const totalResult = await query<any[]>(countSql, status ? [status] : []);
    const total = totalResult[0].total;

    const rows = await query<ProdPlan[]>(dataSql, [...params, pageSizeNum.toString(), offset.toString()]);

    const result: PaginatedResult<ProdPlan> = {
      list: rows,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    };

    const response: ApiResponse<PaginatedResult<ProdPlan>> = {
      success: true,
      message: 'success',
      data: result
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch plan list',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM prod_plan WHERE plan_id = ?`;
    const rows = await query<ProdPlan[]>(sql, [id]);

    if (rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Plan not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ProdPlan> = {
      success: true,
      message: 'success',
      data: rows[0]
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch plan',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { product, quantity, startDate, endDate, status, statusText, progress } = req.body;

    if (!product || !quantity || !startDate || !endDate || !status) {
      const response: ApiResponse = {
        success: false,
        message: 'Product, quantity, startDate, endDate and status are required',
        code: 400
      };
      return res.status(400).json(response);
    }

    const sql = `INSERT INTO prod_plan (product, quantity, startDate, endDate, status, statusText, progress) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const result = await execute(sql, [product, quantity, startDate, endDate, status, statusText || '', progress || 0]);

    const response: ApiResponse<{ insertId: number }> = {
      success: true,
      message: 'Plan created successfully',
      data: { insertId: result.insertId }
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create plan',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { product, quantity, startDate, endDate, status, statusText, progress } = req.body;

    const checkSql = `SELECT * FROM prod_plan WHERE plan_id = ?`;
    const existing = await query<ProdPlan[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Plan not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const sql = `UPDATE prod_plan SET product = ?, quantity = ?, startDate = ?, endDate = ?, status = ?, statusText = ?, progress = ? WHERE plan_id = ?`;
    await execute(sql, [
      product ?? existing[0].product,
      quantity ?? existing[0].quantity,
      startDate ?? existing[0].startDate,
      endDate ?? existing[0].endDate,
      status ?? existing[0].status,
      statusText ?? existing[0].statusText,
      progress ?? existing[0].progress,
      id
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Plan updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update plan',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('Delete plan request for id:', id);

    const checkSql = `SELECT * FROM prod_plan WHERE plan_id = ?`;
    const existing = await query<ProdPlan[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Plan not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    // 1. 先查询所有相关的生产记录ID
    console.log('Querying production records for plan_id:', id);
    const queryRecordsSql = `SELECT record_id FROM prod_record WHERE plan_id = ?`;
    const recordIds = await query<any[]>(queryRecordsSql, [id]);
    console.log('Found production records:', recordIds);

    // 2. 如果有生产记录，先删除相关的质检记录（prod_quality）
    if (recordIds.length > 0) {
      try {
        console.log('Deleting quality records for record_ids:', recordIds.map(r => r.record_id));
        const recordIdList = recordIds.map(r => r.record_id).join(',');
        const deleteQualitySql = `DELETE FROM prod_quality WHERE record_id IN (${recordIdList})`;
        await execute(deleteQualitySql);
        console.log('Quality records deleted successfully');
      } catch (qualityError) {
        console.error('Error deleting quality records, continuing with deletion:', qualityError);
        // 即使删除质检记录失败，也继续执行删除操作
      }
    }

    // 3. 如果有生产记录，先删除相关的执行记录（prod_execute）
    if (recordIds.length > 0) {
      try {
        console.log('Deleting execution records for record_ids:', recordIds.map(r => r.record_id));
        const recordIdList = recordIds.map(r => r.record_id).join(',');
        const deleteExecuteSql = `DELETE FROM prod_execute WHERE record_id IN (${recordIdList})`;
        await execute(deleteExecuteSql);
        console.log('Execution records deleted successfully');
      } catch (executeError) {
        console.error('Error deleting execution records, continuing with deletion:', executeError);
        // 即使删除执行记录失败，也继续执行删除生产记录和计划
      }
    }

    // 4. 删除相关的生产记录（prod_record）
    console.log('Deleting production records for plan_id:', id);
    const deleteRecordsSql = `DELETE FROM prod_record WHERE plan_id = ?`;
    await execute(deleteRecordsSql, [id]);
    console.log('Production records deleted successfully');

    // 4. 最后删除计划（prod_plan）
    console.log('Deleting plan with id:', id);
    const sql = `DELETE FROM prod_plan WHERE plan_id = ?`;
    await execute(sql, [id]);
    console.log('Plan deleted successfully');

    const response: ApiResponse = {
      success: true,
      message: 'Plan deleted successfully'
    };
    res.json(response);
  } catch (error) {
    console.error('Delete plan error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete plan',
      code: 500
    };
    res.status(500).json(response);
  }
});

export default router;