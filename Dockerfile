ARG PYTHON_VERSION=3.12-slim-bullseye

FROM --platform=linux/arm64 python:${PYTHON_VERSION}

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install psycopg2 dependencies.
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /code

WORKDIR /code

RUN pip install poetry
COPY pyproject.toml poetry.lock /code/
RUN poetry config virtualenvs.create false
COPY . /code
RUN poetry install --only main --no-root --no-interaction

EXPOSE 8000

CMD ["gunicorn", "--bind", ":8000", "--workers", "1", "bluewind.wsgi"]