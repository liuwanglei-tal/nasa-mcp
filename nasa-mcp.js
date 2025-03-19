#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const NASA_APOD_URL = 'https://api.nasa.gov/planetary/apod';

// 从配置文件中读取 API key
function getApiKeyFromConfig() {
    try {
        // 尝试从用户主目录读取配置文件
        const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.cursor', 'mcp.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.mcpServers && config.mcpServers.nasa && config.mcpServers.nasa.env && config.mcpServers.nasa.env.NASA_API_KEY) {
                return config.mcpServers.nasa.env.NASA_API_KEY;
            }
        }
    } catch (error) {
        console.error('Warning: Failed to read API key from config file:', error.message);
    }
    return null;
}

// 自然语言处理函数
function parseNaturalLanguage(query) {
    // 转换为小写并去除首尾空格
    query = query.toLowerCase().trim();
    
    // 获取今天的日期
    const today = new Date();
    
    // 处理日期相关的自然语言
    if (query.match(/今天|today|现在|当前/)) {
        return { date: today.toISOString().split('T')[0] };
    }
    
    if (query.match(/昨天|yesterday/)) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return { date: yesterday.toISOString().split('T')[0] };
    }
    
    // 匹配具体日期格式：2024年3月18日 或 2024-03-18
    const cnDateMatch = query.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (cnDateMatch) {
        const [_, year, month, day] = cnDateMatch;
        const formattedMonth = month.padStart(2, '0');
        const formattedDay = day.padStart(2, '0');
        return { date: `${year}-${formattedMonth}-${formattedDay}` };
    }
    
    const isoDateMatch = query.match(/\d{4}-\d{2}-\d{2}/);
    if (isoDateMatch) {
        return { date: isoDateMatch[0] };
    }
    
    // 如果没有找到日期相关信息，返回今天的日期
    return { date: today.toISOString().split('T')[0] };
}

async function handleQuery(query, options = {}) {
    try {
        // 优先使用传入的 API key，如果没有则使用环境变量或配置文件中的值
        const apiKey = options.api_key || process.env.NASA_API_KEY || getApiKeyFromConfig();
        
        if (!apiKey) {
            throw new Error('NASA API Key is required. Please provide it via environment variable NASA_API_KEY, config file, or as a parameter');
        }

        // 解析自然语言查询
        const parsedQuery = parseNaturalLanguage(query);
        
        // 设置请求参数
        const params = {
            api_key: apiKey
        };

        // 如果指定了日期，添加到参数中
        if (parsedQuery.date) {
            params.date = parsedQuery.date;
        }

        const response = await axios.get(NASA_APOD_URL, { params });
        
        // 格式化输出为中文友好的格式
        return JSON.stringify({
            标题: response.data.title,
            日期: response.data.date,
            说明: response.data.explanation,
            图片链接: response.data.url,
            媒体类型: response.data.media_type,
            版权: response.data.copyright
        }, null, 2);
    } catch (error) {
        console.error('Error:', error.message);
        return JSON.stringify({
            错误: error.message,
            详细信息: error.response ? error.response.data : null
        }, null, 2);
    }
}

// 处理命令行参数和标准输入
async function main() {
    // 获取命令行参数
    const args = process.argv.slice(2);
    let options = {};
    let queryFromArgs = '';
    let useStdio = false;

    // 解析命令行参数
    args.forEach(arg => {
        if (arg.startsWith('--api_key=')) {
            options.api_key = arg.split('=')[1];
        } else if (arg.startsWith('--date=')) {
            options.date = arg.split('=')[1];
        } else if (arg === '--stdio') {
            useStdio = true;
        } else {
            queryFromArgs += ' ' + arg;
        }
    });

    // 如果指定了 --stdio 或者检测到管道输入
    if (useStdio || !process.stdin.isTTY) {
        let inputData = '';
        process.stdin.setEncoding('utf-8');
        
        for await (const chunk of process.stdin) {
            inputData += chunk;
        }
        
        // 合并命令行参数和管道输入的查询
        const query = (inputData.trim() + ' ' + queryFromArgs).trim();
        const result = await handleQuery(query, options);
        console.log(result);
    } else if (queryFromArgs.trim()) {
        // 如果只有命令行参数
        const result = await handleQuery(queryFromArgs.trim(), options);
        console.log(result);
    } else {
        console.log('使用方法：');
        console.log('1. 命令行方式：node nasa-mcp.js [--api_key=YOUR_API_KEY] [--date=YYYY-MM-DD] "你的查询"');
        console.log('2. 管道方式：echo "你的查询" | node nasa-mcp.js [--api_key=YOUR_API_KEY] [--date=YYYY-MM-DD]');
        console.log('3. MCP配置方式：使用 --stdio 参数');
        console.log('注意：API key 可以通过以下方式提供：');
        console.log('  - 命令行参数: --api_key=YOUR_API_KEY');
        console.log('  - 环境变量: NASA_API_KEY');
        console.log('  - MCP配置文件: ~/.cursor/mcp.json');
    }
}

main().catch(error => {
    console.error('错误:', error.message);
    process.exit(1);
}); 