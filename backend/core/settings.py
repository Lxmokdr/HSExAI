"""
Django settings for core project.
"""

from pathlib import Path
from datetime import timedelta
import os
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# Priority: 1) Environment variable (Render sets via generateValue: true)
#           2) Config from .env file
#           3) Default (only for local development)
SECRET_KEY = os.environ.get('SECRET_KEY') or config('SECRET_KEY', default='django-insecure-guardian-secret-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

# Safety check: Warn if using default secret key in production
if SECRET_KEY == 'django-insecure-guardian-secret-key-change-in-production' and not DEBUG:
    import warnings
    warnings.warn(
        'SECURITY WARNING: Using default SECRET_KEY in production! '
        'Set SECRET_KEY environment variable or in .env file.',
        RuntimeWarning
    )

# Allowed hosts - use environment variable or default
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1,guardian-vision.onrender.com,guardian-vision.vercel.app',
    cast=lambda v: [s.strip() for s in v.split(',')]
)


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'api',
    'ai_engine',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

# Use SQLite for local development by default, PostgreSQL for production/containerized
USE_SQLITE = config('USE_SQLITE', default=not os.environ.get('RENDER'), cast=bool)

if USE_SQLITE:
    # Local development with SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # PostgreSQL configuration for production/containerized environments
    DB_NAME = os.environ.get('DB_NAME') or config('DB_NAME', default='guardian_db')
    DB_USER = os.environ.get('DB_USER') or config('DB_USER', default='guardian_user')
    db_password_env = os.environ.get('DB_PASSWORD')
    DB_PASSWORD = db_password_env if db_password_env is not None else config('DB_PASSWORD', default='', cast=str)
    DB_HOST = os.environ.get('DB_HOST') or config('DB_HOST', default='localhost')
    DB_PORT = os.environ.get('DB_PORT') or config('DB_PORT', default='5432')

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': DB_NAME,
            'USER': DB_USER,
            'PASSWORD': DB_PASSWORD,
            'HOST': DB_HOST,
            'PORT': DB_PORT,
            'OPTIONS': {
                'connect_timeout': 10,
            },
        }
    }


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'fr-fr'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files — uploaded + annotated detection images (local disk, Phase 1)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# AI Engine settings
AI_WEIGHTS_DIR = BASE_DIR / 'ai_engine' / 'weights'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': None,
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),  # Reduced from 24h to 1h for security
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS settings
# Allow specific origins in production, all in development
CORS_ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:8083',  # Vite default port
    'http://localhost:5173',  # Vite alternative port
    'http://localhost:3000',  # Common dev ports
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8083',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://guardian-vision.vercel.app',
    'https://guardian-vision.onrender.com',
]

# Fallback to allow all in development (for local testing)
# In production, only allow specific origins
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True

# Additional CORS settings for production
if not DEBUG:
    CORS_ALLOW_HEADERS = [
        'accept',
        'accept-encoding',
        'authorization',
        'content-type',
        'dnt',
        'origin',
        'user-agent',
        'x-csrftoken',
        'x-requested-with',
    ]

# Custom User Model
AUTH_USER_MODEL = 'api.User'

