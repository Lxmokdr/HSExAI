"""AI Engine — URL configuration."""

from django.urls import path
from . import views

urlpatterns = [
    # Image detection
    path('detect/image/',          views.detect_image,         name='ai-detect-image'),

    # Detection events
    path('events/',                views.list_events,          name='ai-events-list'),
    path('events/<int:pk>/',       views.event_detail,         name='ai-event-detail'),

    # Violations
    path('violations/',            views.list_violations,      name='ai-violations-list'),

    # Analytics (Phase 3)
    path('analytics/compliance/',  views.analytics_compliance, name='ai-analytics-compliance'),
    path('analytics/zones/',       views.analytics_zones,      name='ai-analytics-zones'),
    path('analytics/summary/',     views.executive_summary,    name='ai-analytics-summary'),
    path('analytics/ppe/',         views.ppe_distribution,     name='ai-analytics-ppe'),
    path('insights/',              views.safety_insights,      name='ai-insights'),

    # Zones
    path('zones/',                 views.zones_list,           name='ai-zones-list'),
    path('zones/<int:pk>/',        views.zone_detail,          name='ai-zone-detail'),
]
