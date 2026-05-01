"""
This module defines the Pydantic schemas for the User and Group models.
These schemas are used for request validation and response serialization in the FastAPI application.
"""
from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional


class UserCreate(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    first_name: str
    last_name:  str
    email: EmailStr


class SpaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    slug: str
    is_private: bool = True


class SpaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    is_private: bool


class ThreadCreate(BaseModel):
    title: Optional[str] = None


class ThreadResponse(BaseModel):
    id: UUID
    title: Optional[str]
    is_public: bool
    message_count: int


class QueryRequest(BaseModel):
    query: str
    thread_id: UUID
    space_id: UUID
