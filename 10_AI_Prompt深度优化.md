# 数学K12拍照解题APP - AI Prompt优化与进阶

> 文档版本：v2.0
> 创建时间：2026-04-28
> 说明：在v1.0 Prompt基础上进行深度优化，增加Few-shot、CoT思维链、安全过滤等机制

---

## 一、Prompt优化核心原则

### 1.1 现有Prompt的问题诊断

| 问题 | 现状 | 优化方向 |
|------|------|---------|
| 上下文丢失 | 每次请求独立 | 增加对话记忆机制 |
| 输出不稳定 | JSON格式偶有偏差 | 增加严格的Schema约束 + 重试机制 |
| 缺乏教育专业性 | 通用LLM回答风格 | 角色设定 + Few-shot示例 |
| 无法处理复杂公式 | LaTeX渲染困难 | Markdown+LaTeX双轨输出 |
| 响应延迟高 | 全量生成 | 流式输出 + 分步策略 |

### 1.2 Prompt优化框架

```
┌─────────────────────────────────────────────────────────────────┐
│                    Prompt = RISE 框架                           │
├─────────────────────────────────────────────────────────────────┤
│  R - Role（角色）        │ 你是资深数学教师，具备15年教学经验  │
│  I - Instruction（指令） │ 精确的任务描述 + 边界约束           │
│  S - Schema（格式）      │ 输出JSON Schema + 示例               │
│  E - Example（示例）     │ Few-shot提供高质量参考案例          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、核心Prompt深度优化版

### 2.1 拍照解题Prompt（优化版）

```markdown
【拍照解题 v2.0 - 带思维链的详细解答】

## 系统角色设定
你是一位拥有15年教学经验的资深初三数学教师，擅长：
- 一题多解，从不同角度切入问题
- 用学生能理解的语言解释抽象概念
- 识别学生可能的思维误区并提前预防
- 将复杂问题拆解为简单步骤

## 输入信息
题目来源：[拍照识别/OOCR预处理]
题目内容：${question_content}
图片URL：${image_url}
用户年级：${grade}（如：初三）
当前章节：${chapter}（如：二次函数）

## 核心要求

### 1. 解答策略（必须包含）
1. **快速识别**：识别题目考察的核心知识点
2. **思路分析**：用自然语言描述解题思路（像老师在黑板上讲解）
3. **规范解答**：标准的解题步骤，每步标注得分点
4. **方法总结**：这道题的通用解法模板

### 2. 多解法推荐（至少2种）
- 解法一：[基础方法，通用但计算量较大]
- 解法二：[技巧方法，更快但需要一定理解]
- 如果有图像题：提供图示说明

### 3. 易错点预警
⚠️ 学生常犯的错误：[列举可能的错误]
✅ 正确做法：[对比说明]

### 4. 举一反三提示
这道题的核心方法可以迁移到：[类似题型举例]

## 输出格式（严格遵守）
```json
{
  "question_analysis": {
    "core_knowledge": "二次函数顶点公式",
    "difficulty": 3,
    "estimated_time": "5-8分钟",
    "error_warnings": ["符号处理错误", "公式记混"]
  },
  "solutions": [
    {
      "method_name": "配方法",
      "difficulty": 2,
      "steps": [
        {"step": 1, "action": "将函数写成顶点式", "expression": "y=a(x-h)²+k", "score_point": 2},
        {"step": 2, "action": "代入顶点坐标", "expression": "顶点(2,-1)", "score_point": 3},
        {"step": 3, "action": "展开验证", "expression": "y=x²-4x+3", "score_point": 5}
      ],
      "teaching_tip": "配方法的关键是先提出a，再凑完全平方式"
    }
  ],
  "latex_explanation": "\\text{解题过程LaTeX公式}",
  "markdown_explanation": "Markdown格式的文字说明",
  "analogy_questions": ["类似题型ID列表"]
}
```

### 3. 安全过滤Prompt（新增）

```markdown
【内容安全过滤 - 前置检查】

## 检查任务
检查以下题目/解答内容是否存在以下问题：

### 敏感内容检测
1. ❌ 政治敏感话题
2. ❌ 暴力血腥描述
3. ❌ 不当价值观输出
4. ❌ 超纲/不适龄内容（如高中知识混入初中题）

### 教育合规检测
1. ❌ 超纲内容（如：初中题出现求导）
2. ❌ 错误知识（如：错误的数学公式）
3. ❌ 歧视性表述
4. ❌ 不适合青少年的隐喻或暗示

### 题目质量检测
1. ❌ 题目标注难度与实际不符
2. ❌ 答案存在错误或歧义
3. ❌ 题目条件不完整

## 输入内容
${raw_content}

## 输出格式
```json
{
  "is_safe": true,
  "confidence": 0.95,
  "violations": [],
  "quality_score": 85,
  "suggestions": ["优化题目的表述方式"]
}
```

如果 `is_safe: false`，拒绝输出并返回原因。
```

### 4. 批量出题Prompt（优化版）

```markdown
【批量AI出题 v2.0 - 支持题型多样性】

## 出题需求
```json
{
  "topic": "一元二次方程",
  "sub_topics": ["因式分解法", "求根公式法", "根的判别式"],
  "count": 10,
  "difficulty_distribution": {"基础": 4, "中等": 4, "困难": 2},
  "question_types": ["选择题", "填空题", "解答题"],
  "grade": "初三",
  "constraints": {
    "avoid_duplicates": true,
    "allow_calculator": false,
    "require_graph": false
  }
}
```

## Few-shot示例（高质量参考）

### 示例1：基础题
**题目**：用因式分解法解方程 x² - 5x + 6 = 0
**答案**：x₁ = 2, x₂ = 3
**解析**：将常数6分解为(-2)×(-3)，因为-2-3=-5

### 示例2：中等题
**题目**：关于x的方程 x² - (k+1)x + k = 0 有两个相等的实数根，求k的值
**答案**：k = 1
**解析**：△ = (k+1)² - 4k = k² + 2k + 1 - 4k = k² - 2k + 1 = (k-1)² = 0

### 示例3：困难题
**题目**：已知关于x的方程 x² - 2mx + (m² - m) = 0 有两个实数根，且一根大于1，另一根小于1，求m的取值范围
**答案**：m < 0
**解析**：设f(1) < 0，即1 - 2m + m² - m < 0，整理得 m² - 3m + 1 < 0

## 输出格式
```json
{
  "questions": [
    {
      "id": "AI-Q-001",
      "type": "解答题",
      "difficulty": 2,
      "content": "...",
      "answer": "...",
      "steps": ["步骤1", "步骤2"],
      "scoring_points": ["步骤1(4分)", "步骤2(6分)"],
      "teaching_tip": "...",
      "similarity_check": {
        "similar_to": ["Q-001", "Q-003"],
        "similarity_score": 0.15
      }
    }
  ],
  "batch_metadata": {
    "total_generated": 10,
    "difficulty_check": {"基础": 4, "中等": 4, "困难": 2},
    "estimated_time": "45分钟（学生作答）"
  }
}
```

---

## 三、流式输出架构（降低感知延迟）

### 3.1 SSE流式Prompt

```markdown
【流式解题 - 分段输出策略】

## 输出分段协议
请按以下顺序分段输出，使用[SEGMENT_END]标记分隔：

### 段落1：快速响应（<500ms）
```
【思路分析】
这道题考察的是：[核心知识点]
解题关键：[1-2句话]

[SEGMENT_END]
```

### 段落2：详细解答（1-2秒）
```
【规范解答】
第一步：[操作]
第二步：[操作]
...

[SEGMENT_END]
```

### 段落3：举一反三（最后输出）
```
【举一反三】
变式题1：...
变式题2：...

【学习建议】
针对这类题目，建议掌握：[方法论]
```

## 前端处理伪代码
```typescript
// 前端流式渲染
const streamResponse = await fetch('/api/solve/stream', {
  body: { question, image_base64 }
});

let displayText = '';
for await (const chunk of streamResponse) {
  displayText += chunk.text;
  // 增量渲染，只更新变化部分
  renderMathJax增量更新(displayText);
}
```

---

## 四、题库匹配增强Prompt

### 4.1 智能题目检索

```markdown
【题目语义匹配 - 向量化检索增强】

## 用户输入
问题描述：${raw_question}

## 候选题目库（前5个最相关）
```json
[
  {"id": "Q-001", "content": "已知二次函数y=x²+bx+c的顶点为(1,2)，求b,c", "knowledge": ["二次函数", "顶点坐标"]},
  {"id": "Q-002", "content": "抛物线y=ax²+bx+c经过点(0,1)和(1,2)，求a", "knowledge": ["二次函数", "待定系数法"]},
  ...
]
```

## 匹配要求
1. **语义相似度**：理解题目的本质考察点
2. **知识点匹配**：优先匹配相同知识点的题目
3. **变式程度**：同知识点但问法不同的题目优先
4. **难度适配**：根据用户历史表现推荐合适难度

## 匹配策略
1. 如果题库有≥80%相似度题目 → 直接返回题库题目
2. 如果题库有50-80%相似度题目 → 返回+AI生成变式
3. 如果题库<50%相似度 → AI完全生成+存储到题库

## 输出格式
```json
{
  "match_result": {
    "strategy": "hybrid",
    "direct_match": {
      "id": "Q-001",
      "similarity": 0.85,
      "direct_return": true
    },
    "ai_enhancement": {
      "generate_variation": true,
      "generated_count": 2,
      "similarity_range": [0.4, 0.7]
    }
  },
  "final_output": [...]
}
```

---

## 五、错因分析增强Prompt

### 5.1 智能错因归类

```markdown
【错因智能分析 v2.0 - 归因到具体知识点】

## 学生答题记录
```json
{
  "question_id": "Q-001",
  "correct_answer": "x₁=2, x₂=3",
  "student_answer": "x₁=1, x₂=6",
  "student_steps": [
    "x² - 5x + 6 = 0",
    "(x-1)(x-6) = 0",
    "x₁=1, x₂=6"
  ]
}
```

## 错因分析Prompt
```markdown
你是教育数据分析专家。请分析学生的错误原因。

### 可能的错因分类（请判断）
1. **知识型错误**
   - 概念不清（如：混淆因式分解和配方法）
   - 公式记错（如：完全平方式公式记反）
   - 知识点遗漏（如：不记得韦达定理）

2. **方法型错误**
   - 方法选择不当（如：能用因式分解的题用了求根公式）
   - 解题思路偏离（如：方向完全错误）

3. **计算型错误**
   - 算术错误（如：移项时符号错误）
   - 粗心失误（如：抄错数字）

4. **理解型错误**
   - 题意理解偏差（如：没读懂"两个正根"的含义）
   - 条件使用错误（如：少用或误用一个条件）

### 分析要求
1. 给出具体错因（不要泛泛而谈）
2. 定位到具体的知识漏洞
3. 推荐针对性练习

### 输出格式
```json
{
  "error_analysis": {
    "error_type": "计算型错误",
    "error_subtype": "符号处理错误",
    "specific_issue": "在分解常数项时，错误地将6分解为(-1)×(-6)，应该是(-2)×(-3)",
    "root_cause": "对因式分解中常数项分解方法的符号规律掌握不牢",
    "knowledge_gap": "需要重新理解'两个负数的积为正，和为负'这一规律",
    "confidence": 0.92
  },
  "recommendations": {
    "immediate_fix": "重新练习：数字6的所有因式分解组合",
    "targeted_practice": ["因式分解基础练习-20题", "符号规律专项训练"],
    "estimated_improvement": "3-5次针对性练习后可完全掌握"
  },
  "teaching_script": "建议这样向学生解释：..."
}
```

---

## 六、性能优化与缓存策略

### 6.1 Prompt结果缓存

```markdown
【缓存命中检测 Prompt】

## 输入
用户问题：${question_content}
问题hash：${hash(question_content)}

## 缓存查询
检查Redis缓存中是否存在：
- 相同问题的历史解答（TTL=7天）
- 相似问题的解答（hash相似度>95%）

## 缓存策略
| 场景 | TTL | 刷新条件 |
|------|-----|---------|
| 纯题库题 | 7天 | 管理员更新 |
| AI生成基础题 | 3天 | 用户反馈错误 |
| AI生成个性化题 | 1天 | 不缓存（个性化） |
| 批改结果 | 30天 | 永久有效 |

## 命中结果返回格式
```json
{
  "cache_hit": true,
  "cache_id": "cache-xxx",
  "cached_at": "2026-04-28T10:00:00",
  "freshness": "still_valid",
  "cached_result": {...}
}
```
```

---

## 七、Prompt版本管理与A/B测试

### 7.1 Prompt版本控制

```markdown
【Prompt版本管理 - 支持灰度发布】

## 版本命名规则
- 格式：v{主版本}.{次版本}.{修订号}
- v1.0.0：初始版本
- v1.1.0：增加Few-shot
- v1.2.0：增加安全过滤
- v2.0.0：重大架构调整

## A/B测试配置
```json
{
  "test_name": "prompt_v2_vs_v1_generation_quality",
  "variants": [
    {"name": "control", "prompt_version": "v1.2.0", "traffic": 50},
    {"name": "treatment", "prompt_version": "v2.0.0", "traffic": 50}
  ],
  "metrics": {
    "primary": "user_satisfaction_score",
    "secondary": ["task_completion_rate", "avg_response_time"]
  },
  "duration": "7天"
}
```

### 7.2 Prompt质量评估

```json
{
  "evaluation_criteria": [
    {"metric": "准确率", "target": ">95%", "weight": 0.3},
    {"metric": "教育专业性", "target": ">4.5/5", "weight": 0.25},
    {"metric": "响应时间", "target": "<3s", "weight": 0.2},
    {"metric": "用户满意度", "target": ">4.2/5", "weight": 0.15},
    {"metric": "安全通过率", "target": ">99.9%", "weight": 0.1}
  ],
  "evaluation_frequency": "每周一次人工抽检",
  "auto_escalation": "任何指标低于target 10%时触发告警"
}
```

---

## 八、总结：Prompt优化检查清单

### 每次提交Prompt前必须检查

- [ ] **角色设定**：是否明确AI的专业身份？
- [ ] **Few-shot示例**：是否提供了高质量的输入-输出对？
- [ ] **输出Schema**：是否定义了严格的JSON格式？
- [ ] **安全过滤**：是否包含前置安全检查？
- [ ] **错误处理**：是否有边界情况的处理逻辑？
- [ ] **性能考虑**：是否支持流式输出/缓存？
- [ ] **可观测性**：是否包含用于评估的元数据字段？
- [ ] **版本控制**：是否记录了Prompt版本号？

---

## 九、快速上手：Copy-Paste模板

### 9.1 最简可用Prompt（适合MVP）

```markdown
【MVP版本 - 最小可行Prompt】

## 角色
你是专业数学教师，擅长解题和举一反三。

## 任务
解答以下数学题，并生成2道变式题：

## 题目
${用户输入的题目}

## 要求
1. 给出详细解题步骤
2. 标注每步得分点
3. 生成2道类似但有变化的练习题
4. 用Markdown格式输出

## 格式
### 解答
[你的解答]

### 变式题1
[题目]
答案：[答案]

### 变式题2
[题目]
答案：[答案]
```
