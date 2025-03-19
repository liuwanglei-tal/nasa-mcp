const axios = require('axios');

const NASA_APOD_URL = 'https://api.nasa.gov/planetary/apod';

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
        // 优先使用传入的 API key，如果没有则使用环境变量
        const apiKey = options.api_key || process.env.NASA_API_KEY;
        
        if (!apiKey) {
            throw new Error('NASA API Key is required. Please provide it via environment variable NASA_API_KEY or as a parameter');
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

// 从标准输入读取数据
process.stdin.setEncoding('utf-8');
let inputData = '';

process.stdin.on('data', chunk => {
    inputData += chunk;
});

process.stdin.on('end', async () => {
    try {
        // 尝试解析输入数据，看是否包含参数
        let query = inputData.trim();
        let options = {};
        
        // 检查是否有 --api_key 参数
        const apiKeyMatch = query.match(/--api_key=([^\s]+)/);
        if (apiKeyMatch) {
            options.api_key = apiKeyMatch[1];
            // 从查询中移除 API key 参数
            query = query.replace(/--api_key=[^\s]+/, '').trim();
        }

        // 检查是否有 --date 参数（保留原有的参数支持）
        const dateMatch = query.match(/--date=(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            options.date = dateMatch[1];
            // 从查询中移除 date 参数
            query = query.replace(/--date=[^\s]+/, '').trim();
        }
        
        const result = await handleQuery(query, options);
        console.log(result);
    } catch (error) {
        console.error(JSON.stringify({ 错误: error.message }));
    }
}); 