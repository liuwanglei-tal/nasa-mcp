const axios = require('axios');

const NASA_APOD_URL = 'https://api.nasa.gov/planetary/apod';

async function handleQuery(query, options = {}) {
    try {
        // 优先使用传入的 API key，如果没有则使用环境变量
        const apiKey = options.api_key || process.env.NASA_API_KEY;
        
        if (!apiKey) {
            throw new Error('NASA API Key is required. Please provide it via environment variable NASA_API_KEY or as a parameter');
        }

        // 设置请求参数
        const params = {
            api_key: apiKey
        };

        // 如果指定了日期，添加到参数中
        if (options.date) {
            params.date = options.date;
        }

        const response = await axios.get(NASA_APOD_URL, { params });
        
        return JSON.stringify({
            title: response.data.title,
            date: response.data.date,
            explanation: response.data.explanation,
            url: response.data.url,
            media_type: response.data.media_type,
            copyright: response.data.copyright
        });
    } catch (error) {
        console.error('Error:', error.message);
        return JSON.stringify({
            error: error.message,
            details: error.response ? error.response.data : null
        });
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

        // 检查是否有 --date 参数
        const dateMatch = query.match(/--date=(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            options.date = dateMatch[1];
            // 从查询中移除 date 参数
            query = query.replace(/--date=[^\s]+/, '').trim();
        }
        
        const result = await handleQuery(query, options);
        console.log(result);
    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
    }
}); 