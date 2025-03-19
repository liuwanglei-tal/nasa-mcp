#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// NASA API endpoints
const NASA_API_ENDPOINTS = {
    APOD: 'https://api.nasa.gov/planetary/apod',
    MARS_PHOTOS: 'https://api.nasa.gov/mars-photos/api/v1/rovers',
    EARTH: 'https://api.nasa.gov/planetary/earth/assets',
    NEO: 'https://api.nasa.gov/neo/rest/v1/feed',
    DONKI: 'https://api.nasa.gov/DONKI', // Space Weather data
    SDO: 'https://api.nasa.gov/SDO/images', // Solar Dynamics Observatory
    SOHO: 'https://sohodata.nascom.nasa.gov/api/data' // Solar and Heliospheric Observatory
};

// 从配置文件中读取 API key
function getApiKeyFromConfig() {
    try {
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
    query = query.toLowerCase().trim();
    
    // 获取当前日期（使用本地时区）
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const result = { type: 'APOD' }; // 默认为 APOD

    // 解析查询类型
    if (query.includes('火星') || query.includes('mars')) {
        result.type = 'MARS';
        // 解析火星车名称
        if (query.includes('好奇号') || query.includes('curiosity')) {
            result.rover = 'curiosity';
        } else if (query.includes('机遇号') || query.includes('opportunity')) {
            result.rover = 'opportunity';
        } else if (query.includes('勇气号') || query.includes('spirit')) {
            result.rover = 'spirit';
        } else if (query.includes('毅力号') || query.includes('perseverance')) {
            result.rover = 'perseverance';
        } else {
            result.rover = 'curiosity'; // 默认使用好奇号
        }
    } else if (query.includes('地球') || query.includes('earth')) {
        result.type = 'EARTH';
        // 尝试解析经纬度
        const coords = query.match(/([-]?\d+\.?\d*)[,\s]+([-]?\d+\.?\d*)/);
        if (coords) {
            result.lat = coords[1];
            result.lon = coords[2];
        }
    } else if (query.includes('小行星') || query.includes('近地') || query.includes('neo')) {
        result.type = 'NEO';
    } else if (query.includes('太空天气') || query.includes('space weather')) {
        result.type = 'WEATHER';
    }

    // 处理日期相关的自然语言
    if (query.match(/今天|today|现在|当前/)) {
        result.date = today.toISOString().split('T')[0];
    } else if (query.match(/昨天|yesterday/)) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        result.date = yesterday.toISOString().split('T')[0];
    } else {
        let targetDate = today; // 默认使用今天

        // 匹配具体日期格式：2024年3月18日 或 2024-03-18
        const cnDateMatch = query.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (cnDateMatch) {
            const [_, year, month, day] = cnDateMatch;
            targetDate = new Date(year, parseInt(month) - 1, parseInt(day));
        } else {
            const isoDateMatch = query.match(/\d{4}-\d{2}-\d{2}/);
            if (isoDateMatch) {
                targetDate = new Date(isoDateMatch[0]);
            }
        }

        // 验证日期不是未来日期
        if (targetDate > today) {
            console.log(`警告：未来日期 ${targetDate.toISOString().split('T')[0]} 已被自动调整为当前日期`);
            targetDate = today;
        }

        result.date = targetDate.toISOString().split('T')[0];
    }

    return result;
}

async function handleAPOD(params) {
    const response = await axios.get(NASA_API_ENDPOINTS.APOD, { params });
    return {
        标题: response.data.title,
        日期: response.data.date,
        说明: response.data.explanation,
        图片链接: response.data.url,
        媒体类型: response.data.media_type,
        版权: response.data.copyright
    };
}

async function handleMarsPhotos(params, rover) {
    const response = await axios.get(`${NASA_API_ENDPOINTS.MARS_PHOTOS}/${rover}/photos`, {
        params: {
            ...params,
            earth_date: params.date
        }
    });
    
    const photos = response.data.photos.slice(0, 5); // 只返回前5张照片
    
    // 获取第一张照片的URL并尝试显示
    if (photos.length > 0) {
        try {
            const firstPhotoUrl = photos[0].img_src;
            console.log('![Mars Photo](' + firstPhotoUrl + ')');
        } catch (error) {
            console.error('无法显示图片:', error.message);
        }
    }
    
    return {
        火星车: rover,
        日期: params.date,
        照片数量: response.data.photos.length,
        照片列表: photos.map(photo => ({
            id: photo.id,
            拍摄时间: photo.earth_date,
            相机: photo.camera.full_name,
            图片链接: photo.img_src
        }))
    };
}

async function handleEarthImagery(params, lat, lon) {
    if (!lat || !lon) {
        throw new Error('需要提供经纬度坐标');
    }
    
    const response = await axios.get(NASA_API_ENDPOINTS.EARTH, {
        params: {
            ...params,
            lat,
            lon,
            dim: 0.1,
            date: params.date
        }
    });
    
    return {
        经度: lon,
        纬度: lat,
        日期: params.date,
        图片链接: response.data.url
    };
}

async function handleNEO(params) {
    const response = await axios.get(NASA_API_ENDPOINTS.NEO, {
        params: {
            ...params,
            start_date: params.date,
            end_date: params.date
        }
    });
    
    const neoList = response.data.near_earth_objects[params.date];
    return {
        日期: params.date,
        小行星数量: neoList.length,
        小行星列表: neoList.map(neo => ({
            名称: neo.name,
            直径: {
                最小: Math.round(neo.estimated_diameter.meters.estimated_diameter_min),
                最大: Math.round(neo.estimated_diameter.meters.estimated_diameter_max)
            },
            是否危险: neo.is_potentially_hazardous_asteroid ? '是' : '否',
            最近距离: Math.round(neo.close_approach_data[0].miss_distance.kilometers) + ' 公里',
            相对速度: Math.round(neo.close_approach_data[0].relative_velocity.kilometers_per_hour) + ' 公里/小时'
        }))
    };
}

async function handleSpaceWeather(params) {
    // 获取最近的太阳耀斑事件
    const flareResponse = await axios.get(`${NASA_API_ENDPOINTS.DONKI}/FLR`, {
        params: {
            ...params,
            startDate: params.date,
            endDate: params.date
        }
    });
    
    // 获取日冕物质抛射事件
    const cmeResponse = await axios.get(`${NASA_API_ENDPOINTS.DONKI}/CME`, {
        params: {
            ...params,
            startDate: params.date,
            endDate: params.date
        }
    });

    // 定义太阳图像URL
    const solarImages = {
        SDO: {
            AIA_171: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0171.jpg',  // 紫外线图像
            AIA_304: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0304.jpg',  // 日冕图像
            AIA_193: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg',  // 极紫外线图像
            AIA_211: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0211.jpg',  // 高温日冕图像
            HMI: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMIIF.jpg'      // 磁场图像
        },
        SOHO: {
            LASCO_C2: 'https://soho.nascom.nasa.gov/data/LATEST/current_c2.gif',  // 外日冕图像
            LASCO_C3: 'https://soho.nascom.nasa.gov/data/LATEST/current_c3.gif'   // 大范围日冕图像
        }
    };
    
    return {
        日期: params.date,
        太阳耀斑: flareResponse.data.map(flare => ({
            开始时间: flare.beginTime,
            结束时间: flare.endTime,
            等级: flare.classType,
            位置: flare.sourceLocation
        })),
        日冕物质抛射: cmeResponse.data.map(cme => ({
            时间: cme.startTime,
            速度: cme.speed ? Math.round(cme.speed) + ' km/s' : '未知',
            类型: cme.type
        })),
        太阳图像: {
            SDO: {
                紫外线图像: {
                    描述: "AIA 171 - 紫外线波段，显示日冕和过渡区",
                    url: solarImages.SDO.AIA_171
                },
                日冕图像: {
                    描述: "AIA 304 - 氦离子辐射，显示色球层和过渡区",
                    url: solarImages.SDO.AIA_304
                },
                极紫外线图像: {
                    描述: "AIA 193 - 极紫外线波段，显示日冕活动区",
                    url: solarImages.SDO.AIA_193
                },
                高温日冕图像: {
                    描述: "AIA 211 - 高温日冕结构",
                    url: solarImages.SDO.AIA_211
                },
                磁场图像: {
                    描述: "HMI - 太阳表面磁场强度图",
                    url: solarImages.SDO.HMI
                }
            },
            SOHO: {
                外日冕图像: {
                    描述: "LASCO C2 - 2-6太阳半径范围的日冕",
                    url: solarImages.SOHO.LASCO_C2
                },
                大范围日冕图像: {
                    描述: "LASCO C3 - 3.7-30太阳半径范围的日冕",
                    url: solarImages.SOHO.LASCO_C3
                }
            }
        }
    };
}

async function handleQuery(query, options = {}) {
    try {
        const apiKey = options.api_key || process.env.NASA_API_KEY || getApiKeyFromConfig();
        if (!apiKey) {
            throw new Error('NASA API Key is required');
        }

        const parsedQuery = parseNaturalLanguage(query);
        const params = { api_key: apiKey };

        if (parsedQuery.date) {
            params.date = parsedQuery.date;
        }

        let result;
        switch (parsedQuery.type) {
            case 'MARS':
                result = await handleMarsPhotos(params, parsedQuery.rover);
                break;
            case 'EARTH':
                result = await handleEarthImagery(params, parsedQuery.lat, parsedQuery.lon);
                break;
            case 'NEO':
                result = await handleNEO(params);
                break;
            case 'WEATHER':
                result = await handleSpaceWeather(params);
                break;
            default:
                result = await handleAPOD(params);
        }

        return JSON.stringify(result, null, 2);
    } catch (error) {
        return JSON.stringify({
            错误: error.message,
            详细信息: error.response ? error.response.data : null
        }, null, 2);
    }
}

async function main() {
    const args = process.argv.slice(2);
    let options = {};
    let queryFromArgs = '';
    let useStdio = false;

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

    if (useStdio || !process.stdin.isTTY) {
        let inputData = '';
        process.stdin.setEncoding('utf-8');
        
        for await (const chunk of process.stdin) {
            inputData += chunk;
        }
        
        const query = (inputData.trim() + ' ' + queryFromArgs).trim();
        const result = await handleQuery(query, options);
        console.log(result);
    } else if (queryFromArgs.trim()) {
        const result = await handleQuery(queryFromArgs.trim(), options);
        console.log(result);
    } else {
        console.log('使用方法：');
        console.log('1. 每日天文图片：');
        console.log('   - 获取今天的图片：echo "今天" | node nasa-mcp.js --stdio');
        console.log('   - 获取指定日期的图片：echo "2024年3月18日" | node nasa-mcp.js --stdio');
        console.log('2. 火星照片：');
        console.log('   - 获取好奇号照片：echo "火星 好奇号" | node nasa-mcp.js --stdio');
        console.log('   - 获取毅力号照片：echo "火星 毅力号" | node nasa-mcp.js --stdio');
        console.log('3. 地球卫星图像：');
        console.log('   - 获取指定位置的图像：echo "地球 39.9042,116.4074" | node nasa-mcp.js --stdio');
        console.log('4. 近地天体数据：');
        console.log('   - 获取今天的近地天体：echo "近地天体" | node nasa-mcp.js --stdio');
        console.log('5. 太空天气：');
        console.log('   - 获取太空天气信息：echo "太空天气" | node nasa-mcp.js --stdio');
        console.log('\nAPI key 可以通过以下方式提供：');
        console.log('  - 命令行参数: --api_key=YOUR_API_KEY');
        console.log('  - 环境变量: NASA_API_KEY');
        console.log('  - MCP配置文件: ~/.cursor/mcp.json');
    }
}

main().catch(error => {
    console.error('错误:', error.message);
    process.exit(1);
}); 