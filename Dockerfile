FROM python:3.12-slim-bullseye

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    postgresql-client \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /bluewind

RUN pip install poetry
COPY pyproject.toml poetry.lock /bluewind/
RUN poetry config virtualenvs.create false
RUN poetry install --only main --no-root

COPY . /bluewind/
