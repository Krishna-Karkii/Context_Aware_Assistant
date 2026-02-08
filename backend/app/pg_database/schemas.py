"""
This module defines the Pydantic schemas for the User and Group models.
These schemas are used for request validation and response serialization in the FastAPI application.
"""

from pydantic import BaseModel, EmailStr
from uuid import UUID

class UserCreate(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class GroupCreate(BaseModel):
    name: str
    description: str

class UserResponse(BaseModel):
    id: UUID
    firstName: str
    lastName: str
    email: EmailStr

class GroupResponse(BaseModel):
    id: UUID
    name: str
    description: str