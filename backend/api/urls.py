# Django imports
from django.urls import path, include

# Django REST Framework imports
from rest_framework.routers import DefaultRouter

# Local imports
from . import views

router = DefaultRouter()
router.register(r'incidents', views.IncidentViewSet, basename='incident')
router.register(r'reports', views.ReportViewSet, basename='report')
router.register(r'equipement', views.EquipmentViewSet, basename='equipment')
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    path('health/', views.health_check, name='health'),
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/refresh/', views.refresh_token, name='refresh-token'),
    path('auth/profile/', views.profile, name='profile'),
    path('auth/profile/update/', views.update_profile, name='profile-update'),
    path('auth/change-password/', views.change_password, name='change-password'),
    path('incidents/stats/', views.IncidentViewSet.as_view({'get': 'stats'}), name='incident-stats'),
    path('incidents/recent/', views.IncidentViewSet.as_view({'get': 'recent'}), name='incident-recent'),
    path('incidents/hardware/<int:pk>/', views.IncidentViewSet.as_view({'put': 'update_hardware'}), name='incident-hardware-update'),
    path('incidents/software/<int:pk>/', views.IncidentViewSet.as_view({'put': 'update_software'}), name='incident-software-update'),
    path('equipement/<int:pk>/history/', views.EquipmentViewSet.as_view({'get': 'history'}), name='equipment-history'),
    path('equipement/<int:pk>/risk/', views.EquipmentViewSet.as_view({'get': 'risk'}), name='equipment-risk'),
    path('equipement/top-risks/', views.EquipmentViewSet.as_view({'get': 'top_risks'}), name='equipment-top-risks'),
    path('risk/train/', views.train_risk_model, name='risk-train'),
    path('', include(router.urls)),
]

