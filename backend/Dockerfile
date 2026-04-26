# syntax=docker/dockerfile:1.7
FROM python:3.12-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install runtime deps first (changes rarely → cache-friendly)
COPY pyproject.toml ./
RUN pip install --no-cache-dir \
      "openai>=1.60.0" \
      "anthropic>=0.40.0" \
      "google-genai>=0.3.0" \
      "python-dotenv>=1.0.1" \
      "psycopg[binary]>=3.2.0"

# App code
COPY politiscales ./politiscales
COPY runners ./runners
COPY db.py run_test.py ./

# Non-root user
RUN useradd --create-home --uid 1001 aigora && chown -R aigora:aigora /app
USER aigora

# Default entrypoint runs the test for whatever provider is passed:
#   docker run ... python run_test.py --provider openai
ENTRYPOINT ["python", "run_test.py"]
CMD ["--help"]
