-- ===============================================
-- 数学K12 APP - MySQL初始化脚本
-- 创建时间: 2026-04-28
-- ===============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS math_k12 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE math_k12;

-- ===============================================
-- 用户表（MySQL，用于订阅/订单等核心业务）
-- ===============================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    `phone` VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
    `nickname` VARCHAR(50) NOT NULL COMMENT '昵称',
    `avatar` VARCHAR(500) DEFAULT '' COMMENT '头像URL',
    `grade` ENUM('初一','初二','初三','高一','高二','高三') DEFAULT '初一' COMMENT '年级',
    `vip_level` ENUM('free','standard','premium') DEFAULT 'free' COMMENT 'VIP等级',
    `vip_expire_time` DATETIME DEFAULT NULL COMMENT 'VIP到期时间',
    `total_questions` INT UNSIGNED DEFAULT 0 COMMENT '累计解题数',
    `total_correct` INT UNSIGNED DEFAULT 0 COMMENT '累计正确数',
    `streak_days` SMALLINT UNSIGNED DEFAULT 0 COMMENT '连续打卡天数',
    `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `login_count` INT UNSIGNED DEFAULT 0 COMMENT '登录次数',
    `wechat_openid` VARCHAR(100) DEFAULT NULL COMMENT '微信OpenID',
    `settings` JSON DEFAULT NULL COMMENT '用户设置',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_phone` (`phone`),
    INDEX `idx_vip_level` (`vip_level`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ===============================================
-- 订阅套餐表
-- ===============================================
CREATE TABLE IF NOT EXISTS `subscription_plans` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '套餐ID',
    `name` VARCHAR(50) NOT NULL COMMENT '套餐名称',
    `price` DECIMAL(10,2) UNSIGNED NOT NULL COMMENT '价格（元）',
    `duration_days` INT UNSIGNED NOT NULL COMMENT '时长（天）',
    `features` JSON NOT NULL COMMENT '功能列表',
    `sort_order` TINYINT UNSIGNED DEFAULT 0 COMMENT '排序',
    `is_active` TINYINT UNSIGNED DEFAULT 1 COMMENT '是否启用',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订阅套餐表';

-- 插入默认套餐
INSERT INTO `subscription_plans` (`name`, `price`, `duration_days`, `features`, `sort_order`) VALUES
('体验会员', 0.00, 0, '["基础解题","每日5题限制","广告展示"]', 1),
('标准会员', 29.00, 30, '["无限解题","举一反三","AI组卷","无广告"]', 2),
('旗舰会员', 199.00, 365, '["全部功能","优先AI通道","专属客服","学习报告"]', 3);

-- ===============================================
-- 订单表
-- ===============================================
CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
    `order_no` VARCHAR(64) NOT NULL UNIQUE COMMENT '订单号',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `plan_id` INT UNSIGNED NOT NULL COMMENT '套餐ID',
    `amount` DECIMAL(10,2) UNSIGNED NOT NULL COMMENT '支付金额',
    `status` ENUM('pending','paid','cancelled','refunded') DEFAULT 'pending' COMMENT '订单状态',
    `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
    `pay_channel` VARCHAR(20) DEFAULT NULL COMMENT '支付渠道',
    `transaction_id` VARCHAR(128) DEFAULT NULL COMMENT '第三方交易号',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_order_no` (`order_no`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ===============================================
-- 用户订阅表
-- ===============================================
CREATE TABLE IF NOT EXISTS `user_subscriptions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '订阅ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `plan_id` INT UNSIGNED NOT NULL COMMENT '套餐ID',
    `start_time` DATETIME NOT NULL COMMENT '开始时间',
    `end_time` DATETIME NOT NULL COMMENT '结束时间',
    `status` ENUM('active','expired','cancelled') DEFAULT 'active' COMMENT '状态',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_end_time` (`end_time`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户订阅表';

-- ===============================================
-- 操作日志表（用于数据分析和风控）
-- ===============================================
CREATE TABLE IF NOT EXISTS `operation_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    `user_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '用户ID',
    `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
    `module` VARCHAR(30) DEFAULT NULL COMMENT '模块',
    `request_params` JSON DEFAULT NULL COMMENT '请求参数',
    `response_code` INT DEFAULT NULL COMMENT '响应码',
    `ip` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `user_agent` VARCHAR(500) DEFAULT NULL COMMENT 'UserAgent',
    `duration_ms` INT DEFAULT NULL COMMENT '耗时（毫秒）',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_action` (`action`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ===============================================
-- 初始化测试用户
-- ===============================================
INSERT INTO `users` (`phone`, `nickname`, `grade`, `vip_level`) VALUES
('13800138000', '测试用户', '初一', 'standard');
