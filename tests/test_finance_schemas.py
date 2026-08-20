import pytest
from database.schemas import FinancialRecordCreate

def test_financial_record_validation():
    rec = FinancialRecordCreate(category="Income", amount=4500.0, description="Client Invoice")
    assert rec.category == "Income"
    assert rec.amount == 4500.0
