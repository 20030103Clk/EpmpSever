# 数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS prod_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prod_db;

-- 设备表
CREATE TABLE IF NOT EXISTS prod_equio (
    equioment_id INT AUTO_INCREMENT PRIMARY KEY,
    statusText VARCHAR(20) NOT NULL,
    equio VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    CONSTRAINT equio UNIQUE (equio)
);

-- 库存表
CREATE TABLE IF NOT EXISTS prod_inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    product VARCHAR(50) NOT NULL,
    code VARCHAR(30) NOT NULL,
    currentStock INT NOT NULL,
    safeStock INT NOT NULL,
    unit VARCHAR(20) NULL,
    location VARCHAR(50) NOT NULL
);

-- 生产计划表
CREATE TABLE IF NOT EXISTS prod_plan (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    product VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    statusText VARCHAR(50) NULL,
    progress INT NOT NULL
);

-- 用户表
CREATE TABLE IF NOT EXISTS prod_user (
    id BIGINT NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    pass VARCHAR(50) NOT NULL,
    remark INT NULL,
    CONSTRAINT name UNIQUE (name),
    CONSTRAINT remark CHECK (`remark` IN (0, 1))
);

-- 生产记录表
CREATE TABLE IF NOT EXISTS prod_record (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    product VARCHAR(50) NOT NULL,
    output INT NOT NULL,
    unqual INT NOT NULL,
    qual INT NOT NULL,
    equio VARCHAR(50) NOT NULL,
    date DATETIME NOT NULL,
    name VARCHAR(50) NOT NULL,
    md TEXT NULL,
    CONSTRAINT equio FOREIGN KEY (equio) REFERENCES prod_equio (equio),
    CONSTRAINT name FOREIGN KEY (name) REFERENCES prod_user (name),
    CONSTRAINT plan_id FOREIGN KEY (plan_id) REFERENCES prod_plan (plan_id)
);

-- 执行记录表
CREATE TABLE IF NOT EXISTS prod_execute (
    execution_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    equioment_id INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    statusText VARCHAR(20) NOT NULL,
    starttime DATE NOT NULL,
    endtime DATE NOT NULL,
    CONSTRAINT equioment_id FOREIGN KEY (equioment_id) REFERENCES prod_equio (equioment_id),
    CONSTRAINT record_index FOREIGN KEY (record_id) REFERENCES prod_record (record_id)
);

-- 质量检验表
CREATE TABLE IF NOT EXISTS prod_quality (
    quality_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    quantity INT NOT NULL,
    result VARCHAR(10) NOT NULL,
    resultText VARCHAR(20) NOT NULL,
    inspectionTime DATETIME NOT NULL,
    CONSTRAINT record_id FOREIGN KEY (record_id) REFERENCES prod_record (record_id)
);

-- 插入测试数据

-- 插入用户 (密码是 123456 的 bcrypt 哈希)
INSERT INTO prod_user (id, name, pass, remark) VALUES
(1, 'admin', '$2b$10$rQZ8K7VK7Y7CVDJKJ8J8K.', 1),
(2, 'worker1', '$2b$10$rQZ8K7VK7Y7CVDJKJ8J8K.', 0),
(3, 'worker2', '$2b$10$rQZ8K7VK7Y7CVDJKJ8J8K.', 0);

-- 插入设备
INSERT INTO prod_equio (statusText, equio, status) VALUES
('运行中', '设备A', 'running'),
('运行中', '设备B', 'running'),
('待机', '设备C', 'idle'),
('维修中', '设备D', 'maintenance');

-- 插入库存
INSERT INTO prod_inventory (product, code, currentStock, safeStock, unit, location) VALUES
('产品X', 'P001', 1000, 200, '件', '仓库A'),
('产品Y', 'P002', 500, 100, '件', '仓库A'),
('原材料Z', 'M001', 2000, 500, 'kg', '仓库B');

-- 插入生产计划
INSERT INTO prod_plan (product, quantity, startDate, endDate, status, statusText, progress) VALUES
('产品X', 100, '2026-04-01', '2026-04-15', 'in_progress', '生产中', 60),
('产品Y', 50, '2026-04-10', '2026-04-20', 'pending', '待生产', 0),
('产品X', 200, '2026-04-15', '2026-04-30', 'planned', '计划中', 0);