# NASA APOD MCP Service

通过自然语言获取 NASA 每日天文图片(APOD)的 MCP 工具。

## 功能特点

- 获取 NASA 每日天文图片
- 支持自然语言查询
- 返回图片标题、描述、URL等信息
- 支持自定义 API 密钥
- 支持在 Cursor IDE 中直接使用

## Cursor 安装

1. 打开 Cursor IDE
2. 在命令面板中输入：
```bash
/mcp install @cursor/nasa-apod-mcp
```

## 配置

1. 访问 [NASA API 门户](https://api.nasa.gov/)
2. 获取你的 API key
3. 设置环境变量 `NASA_API_KEY` 或在使用时通过参数传入

## 使用方法

### 在 Cursor 中使用

```bash
# 使用默认 API key（需要设置环境变量 NASA_API_KEY）
今日天文图

# 使用自定义 API key
今日天文图 --api_key=your-nasa-api-key
```

### 在 Node.js 中使用

```javascript
const client = require('@smithery/client');

async function main() {
  // 使用默认 API key（需要设置环境变量 NASA_API_KEY）
  const result = await client.call('@cursor/nasa-apod-mcp', '今日天文图');
  
  // 或使用自定义 API key
  const resultWithKey = await client.call('@cursor/nasa-apod-mcp', '今日天文图', {
    api_key: 'your-nasa-api-key'
  });
  
  console.log(result);
}

main();
```

### 命令行使用

```bash
# 使用环境变量中的 API key
echo "获取今天的天文图片" | NASA_API_KEY=your_api_key node nasa-mcp.js

# 使用自定义 API key
echo "获取今天的天文图片 --api_key=your-nasa-api-key" | node nasa-mcp.js
```

## 返回数据格式

```json
{
  "title": "图片标题",
  "date": "日期",
  "explanation": "详细解释",
  "url": "图片URL",
  "media_type": "媒体类型",
  "copyright": "版权信息"
}
```

## 许可证

MIT

## 作者

your-username 