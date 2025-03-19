# NASA MCP Service

一个功能丰富的 NASA 数据查询 MCP 工具，支持多种 NASA API 服务和自然语言查询。

## 功能特点

- 天文图片服务 (APOD)
  - 获取 NASA 每日天文图片
  - 支持历史日期查询
  - 返回图片标题、描述、URL等信息

- 火星探测器照片 (Mars Rovers)
  - 支持多个火星探测器：好奇号(Curiosity)、机遇号(Opportunity)、勇气号(Spirit)、毅力号(Perseverance)
  - 按日期查询火星照片
  - 获取不同相机拍摄的图片

- 地球卫星图像 (Earth)
  - 根据经纬度获取卫星图像
  - 支持历史图像查询
  - 提供高分辨率卫星照片

- 近地天体数据 (NEO - Near Earth Objects)
  - 获取特定日期的近地小行星信息
  - 包含小行星大小、距离、速度等数据
  - 危险系数评估

- 太空天气数据 (Space Weather)
  - 太阳耀斑事件信息
  - 日冕物质抛射数据
  - 实时太空天气状况

## Cursor 安装

1. 打开 Cursor IDE
2. 在命令面板中输入：
```bash
/mcp install @cursor/nasa-mcp
```

## 配置

1. 访问 [NASA API 门户](https://api.nasa.gov/)
2. 获取你的 API key
3. 设置环境变量 `NASA_API_KEY` 或在使用时通过参数传入

## 使用方法

### 在 Cursor 中使用

```bash
# 获取今天的天文图片
今天的天文图

# 获取火星照片
火星 好奇号 2024年3月18日

# 获取地球卫星图像
地球 39.9042,116.4074

# 获取近地天体数据
近地小行星 2024年3月18日

# 获取太空天气信息
太空天气 今天
```

### 在 Node.js 中使用

```javascript
const client = require('@smithery/client');

async function main() {
  // 获取火星照片
  const marsPhotos = await client.call('@cursor/nasa-mcp', '火星 好奇号 今天');
  
  // 获取近地天体数据
  const neoData = await client.call('@cursor/nasa-mcp', '近地小行星 今天');
  
  console.log(marsPhotos);
  console.log(neoData);
}

main();
```

### 命令行使用

```bash
# 使用环境变量中的 API key
echo "火星 好奇号 今天" | NASA_API_KEY=your_api_key node nasa-mcp.js

# 使用自定义 API key
echo "地球 39.9042,116.4074" | node nasa-mcp.js --api_key=your-api-key
```

## 返回数据格式

### 天文图片 (APOD)
```json
{
  "标题": "图片标题",
  "日期": "2024-03-19",
  "说明": "详细解释",
  "图片链接": "图片URL",
  "媒体类型": "image",
  "版权": "版权信息"
}
```

### 火星照片
```json
{
  "火星车": "curiosity",
  "日期": "2024-03-19",
  "照片数量": 5,
  "照片列表": [
    {
      "id": 1234567,
      "拍摄时间": "2024-03-19",
      "相机": "NAVCAM",
      "图片链接": "https://..."
    }
  ]
}
```

### 近地天体数据
```json
{
  "日期": "2024-03-19",
  "小行星数量": 5,
  "小行星列表": [
    {
      "名称": "小行星名称",
      "直径": {
        "最小": 100,
        "最大": 200
      },
      "是否危险": "否",
      "最近距离": "1000000 公里",
      "相对速度": "50000 公里/小时"
    }
  ]
}
```

### 太空天气数据
```json
{
  "日期": "2024-03-19",
  "太阳耀斑": [
    {
      "开始时间": "2024-03-19T10:00:00Z",
      "结束时间": "2024-03-19T11:00:00Z",
      "等级": "M2.5",
      "位置": "N30W60"
    }
  ],
  "日冕物质抛射": [
    {
      "时间": "2024-03-19T12:00:00Z",
      "速度": "800 km/s",
      "类型": "CME"
    }
  ]
}
```

## 许可证

MIT

## 作者

your-username 