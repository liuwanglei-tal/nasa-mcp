"""
NASA MCP 工具包的核心功能模块
"""

import os
import json
import requests
from datetime import datetime
from typing import Optional

def get_apod_data(api_key: Optional[str] = None) -> dict:
    """
    获取NASA的天文图片数据
    
    Args:
        api_key: NASA API密钥。如果不提供，将使用环境变量NASA_API_KEY或默认的DEMO_KEY
        
    Returns:
        dict: NASA APOD API的响应数据
    """
    # 按优先级获取API key：参数 > 环境变量 > DEMO_KEY
    nasa_api_key = api_key or os.getenv("NASA_API_KEY", "DEMO_KEY")
    base_url = "https://api.nasa.gov/planetary/apod"
    
    try:
        response = requests.get(
            base_url,
            params={"api_key": nasa_api_key}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        return {"error": f"获取NASA数据时发生错误: {str(e)}"}

def format_apod_response(data: dict) -> str:
    """
    格式化APOD响应数据为易读的文本
    
    Args:
        data: NASA APOD API的响应数据
        
    Returns:
        str: 格式化的天文图片信息
    """
    if "error" in data:
        return data["error"]
    
    return f"""今日天文图片信息：

标题：{data['title']}
日期：{data['date']}
图片链接：{data.get('hdurl') or data['url']}

描述：{data['explanation']}"""

def mcp_nasa_today_apod(query: str = "", api_key: Optional[str] = None) -> str:
    """
    MCP工具：获取今日NASA天文图片
    
    Args:
        query: 自然语言查询，例如"今日天文图"
        api_key: NASA API密钥。如果不提供，将使用环境变量NASA_API_KEY或默认的DEMO_KEY
        
    Returns:
        str: 格式化的天文图片信息
    """
    data = get_apod_data(api_key)
    return format_apod_response(data) 