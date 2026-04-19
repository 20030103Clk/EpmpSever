import { Router, Request, Response } from 'express';
import { query, execute } from '../utils/db';
import { ProdUser, ApiResponse, LoginParams, JwtPayload } from '../types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'your-secret-key-change-in-production';
const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { name, pass }: LoginParams = req.body;

    if (!name || !pass) {
      const response: ApiResponse = {
        success: false,
        message: 'Username and password are required',
        code: 400
      };
      return res.status(400).json(response);
    }

    const sql = `SELECT * FROM prod_user WHERE name = ?`;
    const rows = await query<ProdUser[]>(sql, [name]);

    if (rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid username or password',
        code: 401
      };
      return res.status(401).json(response);
    }

    const user = rows[0];
    
    // 检查密码是否是加密的
    let isPasswordValid = false;
    if (user.pass.length >= 60) {
      // 密码是加密的，使用 bcrypt 验证
      isPasswordValid = await bcrypt.compare(pass, user.pass);
    } else {
      // 密码是明文的，直接比较
      isPasswordValid = pass === user.pass;
    }

    if (!isPasswordValid) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid username or password',
        code: 401
      };
      return res.status(401).json(response);
    }

    const payload: JwtPayload = {
      id: user.id,
      name: user.name,
      remark: user.remark || 0
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });

    const response: ApiResponse<{ token: string; user: Omit<ProdUser, 'pass'> }> = {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          remark: user.remark
        }
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Login failed',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, pass, remark }: LoginParams & { remark?: number } = req.body;

    if (!name || !pass) {
      const response: ApiResponse = {
        success: false,
        message: 'Username and password are required',
        code: 400
      };
      return res.status(400).json(response);
    }

    const checkSql = `SELECT * FROM prod_user WHERE name = ?`;
    const existing = await query<ProdUser[]>(checkSql, [name]);

    if (existing.length > 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Username already exists',
        code: 409
      };
      return res.status(409).json(response);
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    
    // 检查密码长度是否超过数据库列的长度
    if (hashedPassword.length > 255) {
      const response: ApiResponse = {
        success: false,
        message: 'Password is too long',
        code: 400
      };
      return res.status(400).json(response);
    }
    
    // 获取当前最大 ID
    const maxIdResult = await query<any[]>(`SELECT MAX(id) as maxId FROM prod_user`);
    const maxId = maxIdResult[0].maxId || 0;
    const newId = maxId + 1;
    
    const sql = `INSERT INTO prod_user (id, name, pass, remark) VALUES (?, ?, ?, ?)`;
    const result = await execute(sql, [newId, name, hashedPassword, remark || 0]);

    const response: ApiResponse<{ insertId: number }> = {
      success: true,
      message: 'User registered successfully',
      data: { insertId: result.insertId }
    };
    res.json(response);
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // 处理数据库唯一键约束错误（用户名已存在）
    if (error.code === 'ER_DUP_ENTRY') {
      const response: ApiResponse = {
        success: false,
        message: 'Username already exists',
        code: 409
      };
      return res.status(409).json(response);
    }
    
    const response: ApiResponse = {
      success: false,
      message: 'Registration failed',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;

    const totalResult = await query<any[]>(`SELECT COUNT(*) as total FROM prod_user`);
    const total = totalResult[0].total;

    const sql = `SELECT id, name, remark FROM prod_user ORDER BY id DESC LIMIT ? OFFSET ?`;
    const rows = await query<any[]>(sql, [pageSizeNum.toString(), offset.toString()]);

    const result = {
      list: rows,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    };

    const response: ApiResponse<typeof result> = {
      success: true,
      message: 'success',
      data: result
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to fetch user list:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch user list',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sql = `SELECT id, name, remark FROM prod_user WHERE id = ?`;
    const rows = await query<any[]>(sql, [id]);

    if (rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'success',
      data: rows[0]
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch user',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, pass, remark } = req.body;

    const checkSql = `SELECT * FROM prod_user WHERE id = ?`;
    const existing = await query<ProdUser[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    let hashedPassword = existing[0].pass;
    if (pass) {
      hashedPassword = await bcrypt.hash(pass, 10);
    }

    const sql = `UPDATE prod_user SET name = ?, pass = ?, remark = ? WHERE id = ?`;
    await execute(sql, [name ?? existing[0].name, hashedPassword, remark ?? existing[0].remark, id]);

    const response: ApiResponse = {
      success: true,
      message: 'User updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update user',
      code: 500
    };
    res.status(500).json(response);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const checkSql = `SELECT * FROM prod_user WHERE id = ?`;
    const existing = await query<ProdUser[]>(checkSql, [id]);

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
        code: 404
      };
      return res.status(404).json(response);
    }

    const userName = existing[0].name;
    const issues: string[] = [];

    // 检查用户是否有生产记录（prod_record.name 外键关联 prod_user.name）
    const recordCheckSql = `SELECT COUNT(*) as count FROM prod_record WHERE name = ?`;
    const recordResult = await query<any[]>(recordCheckSql, [userName]);
    if (recordResult[0].count > 0) {
      issues.push(`生产记录 (${recordResult[0].count}条)`);
    }

    // 如果有关联记录，返回详细的提示信息
    if (issues.length > 0) {
      const response: ApiResponse = {
        success: false,
        message: `该员工有未完成的工作：${issues.join('、')}。请先处理完这些工作后再删除。`,
        code: 400
      };
      return res.status(400).json(response);
    }

    const sql = `DELETE FROM prod_user WHERE id = ?`;
    await execute(sql, [id]);

    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete user',
      code: 500
    };
    res.status(500).json(response);
  }
});

export default router;