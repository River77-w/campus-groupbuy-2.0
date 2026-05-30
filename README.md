# 校园拼单助理

> 一个面向高校师生的轻量级拼单信息发布与撮合平台

## 功能特点

- **发布拼单**: 轻松发布拼单信息，设置金额、人数、截止时间
- **浏览筛选**: 按校区、分类筛选，快速找到附近的拼单
- **加入拼单**: 一键复制发起人微信号，联系拼单
- **AA计算**: 自动计算人均费用，费用保留两位小数
- **智能推荐**: 基于历史记录推荐相似拼单
- **地理定位**: 自动获取位置，匹配附近校区
- **响应式设计**: 完美适配手机、平板、PC端

## 快速开始

### 方法一：直接打开（推荐）

1. 双击 `index.html` 文件在浏览器中打开
2. 首次使用会自动加载示例数据
3. 可以开始体验完整功能

### 方法二：使用本地服务器

```bash
# 使用 Python
python -m http.server 8080

# 使用 Node.js
npx serve .

# 使用 PHP
php -S localhost:8080
```

然后访问 http://localhost:8080

### 加载示例数据

如果需要重新加载示例数据：

1. 打开浏览器开发者工具（F12）
2. 在控制台（Console）中粘贴以下代码并回车：

```javascript
// 清除旧数据
localStorage.clear();

// 添加示例数据
const sampleData = [
    {
        id: 'GB_demo001',
        merchant: '麦当劳',
        description: '麦辣鸡腿堡套餐双人餐，求拼单！',
        totalAmount: 68.00,
        targetCount: 2,
        currentCount: 1,
        category: 'food',
        deadline: new Date(Date.now() + 2*60*60*1000).toISOString(),
        campus: 'east',
        dormitory: '3号楼',
        wechatId: 'demo_wechat',
        creatorId: 'user_demo',
        status: 'active',
        createdAt: new Date().toISOString()
    }
];
localStorage.setItem('campus_groupbuys', JSON.stringify(sampleData));
location.reload();
```

## 目录结构

```
校园拼单助理/
├── index.html      # 主页面
├── styles.css      # 样式文件
├── app.js          # 主逻辑
├── init-data.js    # 示例数据初始化
├── SPEC.md         # 产品规格说明书
└── README.md       # 使用说明
```

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (原生)
- **存储**: LocalStorage (本地存储)
- **定位**: HTML5 Geolocation API
- **无依赖**: 纯原生实现，无需任何框架

## 核心功能说明

### 发布拼单
- 填写商家名称、商品描述、总金额、目标人数
- 选择商品类型（外卖/奶茶/超市/其他）
- 设置截止时间和校区位置
- 提交后自动生成拼单并显示在列表

### 加入拼单
- 点击拼单卡片查看详情
- 查看人均费用计算结果
- 点击"复制微信号"按钮一键复制
- 联系发起人完成线下拼单

### 智能推荐
- 系统会记录用户浏览和参与的拼单
- 基于历史记录推荐相似校区和类型的拼单
- 推荐列表显示在首页顶部

### 地理位置
- 首次访问会请求位置权限
- 自动匹配最近的校区
- 可手动选择校区进行筛选

## 数据说明

所有数据存储在浏览器 LocalStorage 中：

- `campus_groupbuys`: 拼单列表数据
- `campus_user_data`: 用户偏好数据
- `browser_id`: 浏览器唯一标识
- `locationPromptShown`: 位置提示是否已显示

**注意**: 清除浏览器数据会导致所有拼单数据丢失。

## 浏览器兼容

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ 移动端浏览器

## 后续扩展建议

1. **用户系统**: 添加登录注册功能
2. **后端服务**: 使用 Node.js/Python/PHP 提供 API
3. **数据库**: 接入 MySQL/SQLite 进行数据持久化
4. **即时通讯**: 集成 WebSocket 实现实时聊天
5. **支付功能**: 集成微信支付/支付宝
6. **消息推送**: 添加 Web Push 通知
7. **社交功能**: 评论、点赞、用户主页

## 开发团队

本项目为 [校园拼单助理] 小组课程项目

---

**让拼单更简单，让校园生活更美好！** 🎓
