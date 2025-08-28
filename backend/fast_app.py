import os
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Database setup
DATABASE_URL = "sqlite:///instance/expense_tracker.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy Models
class BankFileFormat(Base):
    __tablename__ = 'bank_file_format'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class UserFile(Base):
    __tablename__ = 'user_file'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    bank_file_format_id = Column(Integer, ForeignKey('bank_file_format.id'), nullable=False)
    file_url = Column(String, nullable=False)
    created_on = Column(DateTime, default=datetime.utcnow)
    transactions = relationship("Transaction", back_populates="user_file")

class Transaction(Base):
    __tablename__ = 'transaction'
    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    remarks_1 = Column(String)
    remarks_2 = Column(String)
    user_file_id = Column(Integer, ForeignKey('user_file.id'), nullable=False)
    created_on = Column(DateTime, default=datetime.utcnow)
    user_file = relationship("UserFile", back_populates="transactions")

# Pydantic Schemas
class BankFileFormatSchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class TransactionSchema(BaseModel):
    id: int
    transaction_date: datetime
    amount: float
    remarks_1: Optional[str] = None
    remarks_2: Optional[str] = None
    created_on: datetime

    class Config:
        from_attributes = True

class UserFileSchema(BaseModel):
    id: int
    user_id: int
    bank_file_format_id: int
    file_url: str
    created_on: datetime
    transactions: List[TransactionSchema] = []

    class Config:
        from_attributes = True

app = FastAPI(
    title="Expense Tracker API",
    description="API for tracking expenses from bank statements.",
    version="0.1.0",
)

API_KEY = "your_secret_api_key"  # In a real app, use a more secure way to manage keys
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == API_KEY:
        return api_key
    else:
        raise HTTPException(status_code=403, detail="Could not validate credentials")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/bank-file-formats", response_model=List[BankFileFormatSchema], tags=["Bank File Formats"])
def get_bank_file_formats(db: Session = Depends(get_db)):
    """
    Retrieves a list of all bank file formats from the database.
    """
    bank_file_formats = db.query(BankFileFormat).all()
    return bank_file_formats

@app.get("/user-files", response_model=List[UserFileSchema], tags=["User Files"], dependencies=[Depends(get_api_key)])
def get_user_files(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieves a list of user files with pagination.
    """
    user_files = db.query(UserFile).offset(skip).limit(limit).all()
    return user_files

@app.get("/user-files/{user_file_id}", response_model=UserFileSchema, tags=["User Files"], dependencies=[Depends(get_api_key)])
def get_user_file(user_file_id: int, db: Session = Depends(get_db)):
    """
    Retrieves a specific user file by its ID.
    """
    user_file = db.query(UserFile).filter(UserFile.id == user_file_id).first()
    if user_file is None:
        raise HTTPException(status_code=404, detail="User file not found")
    return user_file

@app.get("/transactions", response_model=List[TransactionSchema], tags=["Transactions"], dependencies=[Depends(get_api_key)])
def get_transactions(
    skip: int = 0,
    limit: int = 10,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieves a list of transactions with pagination, filtering, and sorting.
    """
    query = db.query(Transaction)

    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    if sort_by:
        if sort_by == "date_asc":
            query = query.order_by(Transaction.transaction_date.asc())
        elif sort_by == "date_desc":
            query = query.order_by(Transaction.transaction_date.desc())
        elif sort_by == "amount_asc":
            query = query.order_by(Transaction.amount.asc())
        elif sort_by == "amount_desc":
            query = query.order_by(Transaction.amount.desc())

    transactions = query.offset(skip).limit(limit).all()
    return transactions
