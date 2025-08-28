# Backend

This directory contains the backend code for the expense tracker application.

## Flask Application

The main Flask application is in `app.py`. To run it:

1.  Make sure you have the dependencies from `requirements.txt` installed in your virtual environment.
2.  Run the application with: `python app.py`

## FastAPI Application

The FastAPI application is in `fast_app.py`. To run it:

1.  Make sure you have a Python 3.12 virtual environment.
2.  Install the dependencies from `fastapi_requirements.txt`:
    `backend/fastapi_venv/bin/pip install -r backend/fastapi_requirements.txt`
3.  Run the application with:
    `backend/fastapi_venv/bin/uvicorn backend.fast_app:app --reload`

The server will be available at `http://127.0.0.1:8000`.
