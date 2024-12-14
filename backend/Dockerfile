# Use Python 3.9 slim image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create translations directory
RUN mkdir -p app/translations

# Initialize translations for supported languages
RUN pybabel extract -F babel.cfg -o app/translations/messages.pot .
RUN pybabel init -i app/translations/messages.pot -d app/translations -l en
RUN pybabel init -i app/translations/messages.pot -d app/translations -l es
RUN pybabel init -i app/translations/messages.pot -d app/translations -l pt
RUN pybabel compile -d app/translations

ENV FLASK_APP=run.py
EXPOSE 5000

# Start the application
CMD ["flask", "run", "--host=0.0.0.0"]
