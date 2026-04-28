# 数学K12拍照解题APP - 数据库表DDL脚本

> 文档版本：v1.0
> 数据库：MongoDB 6.0 + MySQL 8.0
> 创建时间：2026-04-28

---

## 一、MySQL DDL 脚本

> MySQL 用于存储：用户账户、订单、VIP套餐等结构化数据

### 1.1 用户相关表

```sql
-- ============================================
-- 用户账户表
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid` VARCHAR(64) DEFAULT NULL COMMENT '微信openid',
  `unionid` VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `role` ENUM('student', 'parent', 'teacher', 'admin') NOT NULL DEFAULT 'student' COMMENT '用户角色',
  `grade` VARCHAR(20) DEFAULT NULL COMMENT '年级',
  `grade_level` TINYINT DEFAULT NULL COMMENT '年级数值(7-12)',
  `vip_status` TINYINT NOT NULL DEFAULT 0 COMMENT 'VIP状态:0-普通,1-月卡,2-年卡,3-终身',
  `vip_expire_at` DATETIME DEFAULT NULL COMMENT 'VIP到期时间',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '账号状态:0-禁用,1-正常',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) DEFAULT NULL COMMENT '最后登录IP',
  `device_info` JSON DEFAULT NULL COMMENT '设备信息',
  `ext_info` JSON DEFAULT NULL COMMENT '扩展信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_unionid` (`unionid`),
  KEY `idx_role` (`role`),
  KEY `idx_vip_status` (`vip_status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户账户表';


-- ============================================
-- VIP套餐表
-- ============================================
CREATE TABLE IF NOT EXISTS `vip_packages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '套餐ID',
  `name` VARCHAR(50) NOT NULL COMMENT '套餐名称',
  `description` TEXT COMMENT '套餐描述',
  `price` DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '价格(元)',
  `original_price` DECIMAL(10,2) UNSIGNED DEFAULT NULL COMMENT '原价',
  `duration_days` INT NOT NULL DEFAULT 30 COMMENT '有效天数',
  `duration_type` ENUM('month', 'year', 'lifetime') NOT NULL DEFAULT 'month' COMMENT '时长类型',
  `features` JSON NOT NULL COMMENT '包含功能列表',
  `daily_ocr_limit` INT NOT NULL DEFAULT -1 COMMENT '每日OCR限制(-1无限)',
  `daily_paper_limit` INT NOT NULL DEFAULT -1 COMMENT '每日组卷限制(-1无限)',
  `wrongbook_limit` INT NOT NULL DEFAULT -1 COMMENT '错题本容量(-1无限)',
  `ai_diagnosis` TINYINT NOT NULL DEFAULT 1 COMMENT 'AI诊断:0-无,1-有',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0-下架,1-上架',
  `start_time` DATETIME DEFAULT NULL COMMENT '销售开始时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '销售结束时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='VIP套餐表';

-- 初始化默认套餐
INSERT INTO `vip_packages` (`name`, `description`, `price`, `duration_days`, `duration_type`, `features`, `sort_order`) VALUES
('月度会员', '一个月畅学', 29.00, 30, 'month', '["无限拍照解题", "无限错题本", "AI组卷10份/月", "AI批改分析"]', 1),
('年度会员', '一年超值套餐', 199.00, 365, 'year', '["全部功能无限", "专属学习报告", "优先客服响应"]', 2);


-- ============================================
-- 订单表
-- ============================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` VARCHAR(64) NOT NULL COMMENT '订单号',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `package_id` INT UNSIGNED DEFAULT NULL COMMENT '套餐ID',
  `product_type` ENUM('vip', 'item', 'service') NOT NULL DEFAULT 'vip' COMMENT '商品类型',
  `product_id` VARCHAR(50) DEFAULT NULL COMMENT '商品ID',
  `product_name` VARCHAR(100) DEFAULT NULL COMMENT '商品名称',
  `amount` DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '订单金额',
  `discount_amount` DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '优惠金额',
  `pay_amount` DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '实付金额',
  `payment_method` VARCHAR(20) DEFAULT NULL COMMENT '支付方式:wechat/alipay',
  `status` ENUM('pending', 'paid', 'cancelled', 'refunded', 'expired') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
  `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
  `expire_time` DATETIME DEFAULT NULL COMMENT '订单过期时间',
  `transaction_id` VARCHAR(64) DEFAULT NULL COMMENT '支付流水号',
  `ext_info` JSON DEFAULT NULL COMMENT '扩展信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';


-- ============================================
-- API调用统计表
-- ============================================
CREATE TABLE IF NOT EXISTS `api_usage_stats` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `api_type` VARCHAR(50) NOT NULL COMMENT 'API类型:ocr/llm/search',
  `call_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '调用次数',
  `token_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Token消耗',
  `cost_amount` DECIMAL(10,4) UNSIGNED NOT NULL DEFAULT 0.0000 COMMENT '估算成本(元)',
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_api_date` (`user_id`, `api_type`, `stat_date`),
  KEY `idx_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API调用统计表';


-- ============================================
-- 每日配额表
-- ============================================
CREATE TABLE IF NOT EXISTS `user_daily_quota` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `quota_type` VARCHAR(50) NOT NULL COMMENT '配额类型:ocr/similar/paper',
  `used_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已使用次数',
  `limit_count` INT NOT NULL DEFAULT 10 COMMENT '限制次数(-1无限)',
  `quota_date` DATE NOT NULL COMMENT '配额日期',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_type_date` (`user_id`, `quota_type`, `quota_date`),
  KEY `idx_quota_date` (`quota_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户每日配额表';
```

---

## 二、MongoDB Collection DDL

> MongoDB 用于存储：题目、错题、试卷、学情等文档数据

### 2.1 题目库（questions）

```javascript
// 创建题目集合
db.createCollection("questions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["question_no", "content", "answer", "subject", "grade", "knowledge_points", "difficulty", "source", "created_at"],
      properties: {
        question_no: { bsonType: "string" },
        content: { bsonType: "string" },
        content_html: { bsonType: "string" },
        images: { bsonType: "array", items: { bsonType: "string" } },
        answer: { bsonType: "string" },
        answer_type: { enum: ["single", "multiple", "subjective"] },
        solutions: { bsonType: "array" },
        subject: { bsonType: "string" },
        grade: { bsonType: "string" },
        chapter: { bsonType: "string" },
        knowledge_points: { bsonType: "array", items: { bsonType: "string" } },
        difficulty: { bsonType: "int", minimum: 1, maximum: 5 },
        question_type: { bsonType: "string" },
        type_tags: { bsonType: "array", items: { bsonType: "string" } },
        source: { bsonType: "string" },
        source_id: { bsonType: "string" },
        similar_questions: { bsonType: "array", items: { bsonType: "objectId" } },
        parent_question_id: { bsonType: "objectId" },
        stats: {
          bsonType: "object",
          properties: {
            usage_count: { bsonType: "int" },
            correct_count: { bsonType: "int" },
            wrong_count: { bsonType: "int" },
            correct_rate: { bsonType: "double" }
          }
        },
        status: { enum: ["pending", "approved", "rejected", "archived"] },
        is_active: { bsonType: "bool" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// 创建索引
db.questions.createIndex({ "question_no": 1 }, { unique: true });
db.questions.createIndex({ "subject": 1, "grade": 1 });
db.questions.createIndex({ "knowledge_points": 1 });
db.questions.createIndex({ "difficulty": 1 });
db.questions.createIndex({ "question_type": 1 });
db.questions.createIndex({ "source": 1, "status": 1 });
db.questions.createIndex(
  { "content": "text", "answer": "text" },
  { weights: { content: 10, answer: 5 }, name: "question_text_search" }
);
db.questions.createIndex({ "subject": 1, "grade": 1, "difficulty": 1, "knowledge_points": 1 });
db.questions.createIndex({ "stats.usage_count": -1 });
```

### 2.2 用户错题本（wrong_questions）

```javascript
// 创建错题集合
db.createCollection("wrong_questions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "question_id", "question_snapshot", "error_type", "created_at"],
      properties: {
        user_id: { bsonType: "objectId" },
        question_id: { bsonType: "objectId" },
        question_snapshot: {
          bsonType: "object",
          properties: {
            content: { bsonType: "string" },
            answer: { bsonType: "string" },
            solutions: { bsonType: "array" },
            knowledge_points: { bsonType: "array" },
            difficulty: { bsonType: "int" },
            question_type: { bsonType: "string" },
            images: { bsonType: "array" }
          }
        },
        wrong_answer: { bsonType: "string" },
        error_type: {
          enum: ["calculation_error", "concept_confusion", "wrong_method", "careless_mistake", "incomplete_understanding", "knowledge_gap", "reading_error"]
        },
        error_reason: { bsonType: "string" },
        ai_error_analysis: { bsonType: "string" },
        mastery_level: { bsonType: "double", minimum: 0, maximum: 1 },
        review_schedule: {
          bsonType: "object",
          properties: {
            review_dates: { bsonType: "array" },
            current_index: { bsonType: "int" },
            intervals: { bsonType: "array" }
          }
        },
        similar_questions_generated: { bsonType: "array", items: { bsonType: "objectId" } },
        practice_history: { bsonType: "array" },
        tags: { bsonType: "array", items: { bsonType: "string" } },
        notes: { bsonType: "string" },
        is_important: { bsonType: "bool" },
        is_active: { bsonType: "bool" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
        last_reviewed_at: { bsonType: "date" },
        next_review_at: { bsonType: "date" }
      }
    }
  }
});

// 创建索引
db.wrong_questions.createIndex({ "user_id": 1 });
db.wrong_questions.createIndex({ "user_id": 1, "created_at": -1 });
db.wrong_questions.createIndex({ "user_id": 1, "knowledge_points": 1 });
db.wrong_questions.createIndex({ "user_id": 1, "mastery_level": 1 });
db.wrong_questions.createIndex({ "next_review_at": 1 }, { sparse: true });
db.wrong_questions.createIndex({ "question_id": 1 });
```

### 2.3 生成试卷（generated_papers）

```javascript
// 创建试卷集合
db.createCollection("generated_papers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["paper_code", "user_id", "title", "subject", "grade", "status", "sections", "created_at"],
      properties: {
        paper_code: { bsonType: "string" },
        user_id: { bsonType: "objectId" },
        title: { bsonType: "string" },
        subject: { bsonType: "string" },
        grade: { bsonType: "string" },
        duration: { bsonType: "int" },
        total_score: { bsonType: "int" },
        status: { enum: ["draft", "active", "submitted", "graded", "expired"] },
        sections: { bsonType: "array" },
        ai_generated_questions: { bsonType: "array" },
        answers: { bsonType: "array" },
        grading_result: { bsonType: "object" },
        generation_params: {
          bsonType: "object",
          properties: {
            source_types: { bsonType: "array" },
            knowledge_points: { bsonType: "array" },
            difficulty_preference: { bsonType: "string" }
          }
        },
        expires_at: { bsonType: "date" },
        created_at: { bsonType: "date" },
        completed_at: { bsonType: "date" }
      }
    }
  }
});

// 创建索引
db.generated_papers.createIndex({ "paper_code": 1 }, { unique: true });
db.generated_papers.createIndex({ "user_id": 1 });
db.generated_papers.createIndex({ "user_id": 1, "created_at": -1 });
db.generated_papers.createIndex({ "user_id": 1, "status": 1 });
db.generated_papers.createIndex({ "created_at": -1 });
```

### 2.4 学生画像（students）

```javascript
// 创建学生画像集合
db.createCollection("students", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "grade", "created_at"],
      properties: {
        user_id: { bsonType: "objectId" },
        grade: { bsonType: "string" },
        grade_level: { bsonType: "int" },
        subjects: { bsonType: "array", items: { bsonType: "string" } },
        knowledge_mastery: {
          bsonType: "object",
          additionalProperties: {
            bsonType: "object",
            properties: {
              level: { bsonType: "double" },
              total_attempts: { bsonType: "int" },
              correct_count: { bsonType: "int" },
              correct_rate: { bsonType: "double" },
              avg_time: { bsonType: "double" },
              last_practiced_at: { bsonType: "date" },
              trend: { enum: ["improving", "stable", "declining"] }
            }
          }
        },
        learning_stats: {
          bsonType: "object",
          properties: {
            total_questions_attempted: { bsonType: "int" },
            total_wrong_questions: { bsonType: "int" },
            total_papers_completed: { bsonType: "int" },
            total_study_time_minutes: { bsonType: "int" },
            current_streak_days: { bsonType: "int" },
            longest_streak_days: { bsonType: "int" },
            last_active_at: { bsonType: "date" }
          }
        },
        current_weak_points: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              knowledge_point: { bsonType: "string" },
              weight: { bsonType: "double" },
              evidence: { bsonType: "array" },
              suggested_practice_count: { bsonType: "int" },
              last_weak_at: { bsonType: "date" }
            }
          }
        },
        preferences: {
          bsonType: "object",
          properties: {
            difficulty_preference: { bsonType: "string" },
            practice_frequency: { bsonType: "string" },
            notification_enabled: { bsonType: "bool" },
            notification_time: { bsonType: "string" }
          }
        },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// 创建索引
db.students.createIndex({ "user_id": 1 }, { unique: true });
db.students.createIndex({ "grade_level": 1 });
```

---

## 三、Redis 数据结构设计

### 3.1 Key 命名规范

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Redis Key 命名规范                                                           │
│                                                                              │
│  格式：{模块}:{业务}:{标识符}:{扩展}                                          │
│                                                                              │
│  模块前缀：                                                                   │
│  · user - 用户相关                                                            │
│  · session - 会话相关                                                         │
│  · cache - 缓存                                                              │
│  · quota - 配额                                                              │
│  · rate - 限流                                                               │
│  · lock - 分布式锁                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 数据结构示例

```redis
-- 用户会话缓存
SET user:session:{user_id} '{"token":"xxx","grade":"初三","vip_status":1}'
EXPIRE user:session:{user_id} 604800  -- 7天

-- LLM结果缓存（防重复调用）
SET cache:llm:{md5(prompt)} '{"result":{...},"generated_at":"..."}'
EXPIRE cache:llm:{md5(prompt)} 86400  -- 24小时

-- 用户每日配额
HSET quota:daily:{user_id}:{date} ocr_calls 0 similar_calls 0 paper_calls 0
EXPIRE quota:daily:{user_id}:{date} 172800  -- 2天

-- 限流器（滑动窗口）
ZADD rate:limit:{api_type}:{user_id} {timestamp} {request_id}
ZREMRANGEBYSCORE rate:limit:{api_type}:{user_id} 0 {timestamp-60}
ZCARD rate:limit:{api_type}:{user_id}  -- 检查数量

-- 热门题目缓存（Sorted Set）
ZADD cache:hot_questions:math:初三 {usage_count} {question_id}
ZREVRANGE cache:hot_questions:math:初三 0 99  -- 获取TOP100

-- 用户学习连续天数
SET user:streak:{user_id} {days}
EXPIRE user:streak:{user_id} 2592000  -- 30天
```

---

## 四、数据迁移脚本示例

```javascript
// MongoDB 数据迁移：v1.0 -> v1.1
// 添加新字段和索引

// 1. 为题目添加质量评分字段
db.questions.updateMany(
  { quality_score: { $exists: false } },
  { $set: { quality_score: null } }
);

// 2. 为错题添加AI分析版本字段
db.wrong_questions.updateMany(
  { ai_analysis_version: { $exists: false } },
  { $set: { ai_analysis_version: 0 } }
);

// 3. 创建复合索引优化查询
db.generated_papers.createIndex({ "user_id": 1, "status": 1, "created_at": -1 });

// 4. 删除过期试卷（超过30天未作答）
db.generated_papers.deleteMany({
  status: "draft",
  created_at: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
});
```

---

*DDL文档结束*
