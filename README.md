# NASA MCP 工具

这是一个基于 MCP (Machine Conversation Protocol) 的工具，用于通过自然语言获取 NASA 的天文图片数据。

## 功能特点

- 支持自然语言查询 NASA 每日天文图片 (APOD)
- 返回格式化的图片信息，包括标题、日期、描述和高清图片链接
- 支持自定义 NASA API key
- 简单易用，无需复杂参数

## 安装方法

1. 确保你已经安装了 Python 3.7 或更高版本
2. 安装 MCP CLI 工具：
   ```bash
   pip install mcp-cli
   ```

3. 安装 NASA MCP 工具：
   ```bash
   pip install nasa-mcp
   ```

## 使用方法

### 基本使用

1. 在命令行中使用（使用默认的 DEMO_KEY）：
   ```bash
   mcp "今日天文图"
   ```

2. 在命令行中使用自定义 API key：
   ```bash
   mcp "今日天文图" --api_key "your-api-key-here"
   ```

3. 在 Python 代码中使用：
   ```python
   from mcp.client import Client
   
   client = Client()
   
   # 使用默认的 DEMO_KEY
   result = client.call("今日天文图")
   print(result)
   
   # 使用自定义 API key
   result = client.call("今日天文图", api_key="your-api-key-here")
   print(result)
   ```

### API Key 配置

你可以通过以下三种方式配置 NASA API key（按优先级排序）：

1. 直接在调用时传入：
   ```python
   result = client.call("今日天文图", api_key="your-api-key-here")
   ```

2. 设置环境变量：
   ```bash
   export NASA_API_KEY="your-api-key-here"
   ```

3. 使用默认的 DEMO_KEY（有请求频率限制）

获取 NASA API key：
1. 访问 [NASA API 门户](https://api.nasa.gov/)
2. 填写注册表单
3. 你将立即收到 API key

注意：DEMO_KEY 的限制是：
- 每小时最多 30 次请求
- 每天最多 50 次请求

建议获取自己的 API key，每小时可以请求 1,000 次。

## 支持的查询语句

- "今日天文图"
- "显示今天的天文图片"
- "获取今天的天文图"

## 示例输出

```
今日天文图片信息：

标题：Blue Ghost's Diamond Ring
日期：2024-03-19
图片链接：https://apod.nasa.gov/apod/image/xxx.jpg

描述：这是一张来自 NASA 的精彩天文图片...
```

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 作者

你的名字 (your.email@example.com) 