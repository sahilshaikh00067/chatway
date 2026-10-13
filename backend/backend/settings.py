from pathlib import Path
import os
import dj_database_url

# ==================================================
# BASE DIRECTORY
# ==================================================
BASE_DIR = Path(__file__).resolve().parent.parent


# ==================================================
# SECURITY SETTINGS
# ==================================================
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")

if not SECRET_KEY:
    if os.environ.get("RENDER"):
        raise RuntimeError(
            "DJANGO_SECRET_KEY is missing in Render environment variables."
        )
    SECRET_KEY = "django-insecure-local-development-only-change-before-production"

DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() == "true"

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    ".onrender.com",
    "cloudwhatsapp.in",
    "www.cloudwhatsapp.in",
]


# ==================================================
# CSRF TRUSTED ORIGINS
# ==================================================
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://chatway.vercel.app",
    "https://cloudwhatsapp.in",
    "https://www.cloudwhatsapp.in",
]


# ==================================================
# INSTALLED APPS
# ==================================================
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "api",
]


# ==================================================
# MIDDLEWARE
# ==================================================
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ==================================================
# CORS SETTINGS
# ==================================================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://chatway.vercel.app",
    "https://cloudwhatsapp.in",
    "https://www.cloudwhatsapp.in",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]


# ==================================================
# URL CONFIGURATION
# ==================================================
ROOT_URLCONF = "backend.urls"


# ==================================================
# TEMPLATES
# ==================================================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ==================================================
# WSGI
# ==================================================
WSGI_APPLICATION = "backend.wsgi.application"


# ==================================================
# DATABASE
# ==================================================
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # Render PostgreSQL or another configured database
    DATABASES = {
        "default": dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=60,
            conn_health_checks=True,
        )
    }
elif not os.environ.get("RENDER"):
    # Local development fallback only
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    raise RuntimeError(
        "DATABASE_URL is missing. "
        "Configure it in Render Environment Variables."
    )


# ==================================================
# PASSWORD VALIDATION
# ==================================================
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ==================================================
# INTERNATIONALIZATION
# ==================================================
LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# ==================================================
# STATIC FILES
# ==================================================
STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_STORAGE = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
)


# ==================================================
# MEDIA FILES
# ==================================================
MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# ==================================================
# FILE UPLOAD LIMITS
# ==================================================
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024

FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024


# ==================================================
# REST FRAMEWORK
# ==================================================
REST_FRAMEWORK = {
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.JSONParser",
    ],
}


# ==================================================
# PROXY / HTTPS SETTINGS
# ==================================================
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Enable HTTPS redirects only if your production domain
# and Render HTTPS configuration are working correctly.
SECURE_SSL_REDIRECT = (
    os.environ.get("DJANGO_SECURE_SSL_REDIRECT", "False").lower()
    == "true"
)

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG


# ==================================================
# DEFAULT PRIMARY KEY
# ==================================================
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
