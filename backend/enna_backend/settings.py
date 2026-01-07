"""
Django settings for enna_backend project.
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
SECRET_KEY = os.environ.get('SECRET_KEY') or config('SECRET_KEY', default='django-insecure-enna-secret-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

# Safety check: Warn if using default secret key in production
if SECRET_KEY == 'django-insecure-enna-secret-key-change-in-production' and not DEBUG:
    import warnings
    warnings.warn(
        'SECURITY WARNING: Using default SECRET_KEY in production! '
        'Set SECRET_KEY environment variable or in .env file.',
        RuntimeWarning
    )

# Allowed hosts - use environment variable or default
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1,enna-atc-gestion-des-incidents.onrender.com,enna-atc-gestion-des-incidents.vercel.app',
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

ROOT_URLCONF = 'enna_backend.urls'

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

WSGI_APPLICATION = 'enna_backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

# PostgreSQL configuration
# Check environment variables first (for Render/containerized environments)
# Then fall back to config() which reads from .env file
# Use os.environ.get() with None check to properly handle empty strings
DB_NAME = os.environ.get('DB_NAME') or config('DB_NAME', default='enna_db')
DB_USER = os.environ.get('DB_USER') or config('DB_USER', default='enna_user')
# For password, check if it exists in environment (even if empty string)
db_password_env = os.environ.get('DB_PASSWORD')
DB_PASSWORD = db_password_env if db_password_env is not None else config('DB_PASSWORD', default='enna_password', cast=str)
DB_HOST = os.environ.get('DB_HOST') or config('DB_HOST', default='localhost')
DB_PORT = os.environ.get('DB_PORT') or config('DB_PORT', default='5432')

# PostgreSQL database configuration
# Use Unix socket (peer authentication) only for local development
# Use TCP/IP connection with password for containerized/cloud deployments
db_host = DB_HOST if DB_HOST else 'localhost'
db_port = DB_PORT if DB_PORT else '5432'

# Check if we're in a containerized/cloud environment
# (indicated by DB_HOST not being localhost or environment variables)
is_containerized = (
    db_host not in ['localhost', '127.0.0.1', ''] or
    os.environ.get('RENDER', '').lower() == 'true' or
    os.environ.get('DYNO', '') != '' or  # Heroku
    os.environ.get('CONTAINER', '').lower() == 'true' or
    os.environ.get('DATABASE_URL', '') != ''  # Common in cloud platforms
)

# Check if password is actually set (not empty, not default, not just whitespace)
has_password = (
    DB_PASSWORD and 
    DB_PASSWORD.strip() != '' and 
    DB_PASSWORD != 'enna_password'
)

# Always use TCP/IP connection with password authentication in containerized environments
# In local development, use Unix socket if no password is set
if is_containerized:
    # Containerized environment - must use password authentication
    # Render sets DB_PASSWORD via fromDatabase in render.yaml
    # Always use environment variables directly in containerized environments
    final_password = os.environ.get('DB_PASSWORD', '')
    final_host = os.environ.get('DB_HOST', '')
    final_user = os.environ.get('DB_USER', '')
    final_name = os.environ.get('DB_NAME', '')
    final_port = os.environ.get('DB_PORT', '5432')
    
    # Fallback to config values if environment variables are not set
    # (This should not happen in Render, but provides safety)
    if not final_password:
        final_password = DB_PASSWORD
    if not final_host:
        final_host = db_host
    if not final_user:
        final_user = DB_USER
    if not final_name:
        final_name = DB_NAME
    
    # If password is still not set or is default, raise error with helpful message
    if not final_password or final_password.strip() == '' or final_password == 'enna_password':
        # Provide detailed error for debugging
        env_vars = {
            'DB_PASSWORD': 'SET' if os.environ.get('DB_PASSWORD') else 'NOT SET',
            'DB_HOST': os.environ.get('DB_HOST', 'NOT SET'),
            'DB_USER': os.environ.get('DB_USER', 'NOT SET'),
            'DB_NAME': os.environ.get('DB_NAME', 'NOT SET'),
            'DB_PORT': os.environ.get('DB_PORT', 'NOT SET'),
            'RENDER': os.environ.get('RENDER', 'NOT SET'),
        }
        raise ValueError(
            f'DB_PASSWORD must be set in containerized environments. '
            f'Environment variables: {env_vars}. '
            f'Please ensure the database service "enna-db" is linked to the web service in Render dashboard, '
            f'or manually set DB_PASSWORD, DB_HOST, DB_USER, DB_NAME, DB_PORT environment variables.'
        )
    
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': final_name,
            'USER': final_user,
            'PASSWORD': final_password,
            'HOST': final_host,
            'PORT': final_port,
            'OPTIONS': {
                'connect_timeout': 10,
            },
        }
    }
elif has_password:
    # Local development with password - use TCP/IP
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': DB_NAME,
            'USER': DB_USER,
            'PASSWORD': DB_PASSWORD,
            'HOST': db_host,
            'PORT': db_port,
            'OPTIONS': {
                'connect_timeout': 10,
            },
        }
    }
else:
    # Local development - Use TCP/IP connection with localhost
    # Try to use password authentication first, fall back to peer auth via socket
    # If DB_USER is 'postgres' and no password, try socket first
    if DB_USER == 'postgres' and not DB_PASSWORD:
        # Try Unix socket for peer authentication (requires running as postgres user)
        # Use port 5433 if configured, otherwise try 5433 (PostgreSQL 16 default)
        socket_port = db_port if db_port != '5432' else '5433'
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': DB_NAME,
                'USER': 'postgres',
                'HOST': '/var/run/postgresql',
                'PORT': socket_port,
            }
        }
    else:
        # Use TCP/IP connection with configured credentials
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': DB_NAME,
                'USER': DB_USER,
                'PASSWORD': DB_PASSWORD if DB_PASSWORD else '',
                'HOST': db_host,
                'PORT': db_port,
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
    'http://localhost:5173',  # Vite dev server
    'https://enna-atc-gestion-des-incidents.vercel.app',
    'https://enna-atc-gestion-des-incidents.onrender.com',
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

