import { RowDataPacket } from 'mysql2';

export interface ProdEquio extends RowDataPacket {
  equioment_id: number;
  statusText: string;
  equio: string;
  status: string;
}

export interface ProdInventory extends RowDataPacket {
  inventory_id: number;
  product: string;
  code: string;
  currentStock: number;
  safeStock: number;
  unit: string | null;
  location: string;
}

export interface ProdPlan extends RowDataPacket {
  plan_id: number;
  product: string;
  quantity: number;
  startDate: Date;
  endDate: Date;
  status: string;
  statusText: string | null;
  progress: number;
}

export interface ProdUser extends RowDataPacket {
  id: number;
  name: string;
  pass: string;
  remark: number | null;
}

export interface ProdRecord extends RowDataPacket {
  record_id: number;
  plan_id: number;
  product: string;
  output: number;
  unqual: number;
  qual: number;
  equio: string;
  date: Date;
  name: string;
  md: string | null;
}

export interface ProdQuality extends RowDataPacket {
  quality_id: number;
  record_id: number;
  product: string;
  quantity: number;
  qual: number;
  unqual: number;
  inspection_time: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginParams {
  name: string;
  pass: string;
}

export interface JwtPayload {
  id: number;
  name: string;
  remark: number;
}