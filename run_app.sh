#!/bin/bash

# Navigate to the backend directory
cd backend

# Activate the virtual environment
source venv/bin/activate

# Start the Uvicorn server
uvicorn app:app --reload --host 0.0.0.0
