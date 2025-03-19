from typing import Optional, Dict, Any
import requests
from datetime import datetime
from pydantic import BaseModel

class ApodResponse(BaseModel):
    date: str
    explanation: str
    hdurl: Optional[str]
    media_type: str
    service_version: str
    title: str
    url: str

class NasaMcpClient:
    """NASA MCP Client for accessing NASA API services"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Initialize the NASA MCP client
        
        Args:
            base_url (str): The base URL of the MCP service
        """
        self.base_url = base_url.rstrip('/')
        
    def get_apod(self, date: Optional[str] = None) -> ApodResponse:
        """
        Get NASA's Astronomy Picture of the Day (APOD)
        
        Args:
            date (str, optional): The date of the APOD image to retrieve (YYYY-MM-DD format)
            
        Returns:
            ApodResponse: The APOD data including image URL and explanation
            
        Raises:
            requests.exceptions.RequestException: If the request fails
            ValueError: If the date format is invalid
        """
        params: Dict[str, Any] = {}
        if date:
            try:
                datetime.strptime(date, "%Y-%m-%d")
                params["date"] = date
            except ValueError:
                raise ValueError("Invalid date format. Please use YYYY-MM-DD")
                
        response = requests.get(f"{self.base_url}/api/nasa/apod", params=params)
        response.raise_for_status()
        return ApodResponse(**response.json()) 