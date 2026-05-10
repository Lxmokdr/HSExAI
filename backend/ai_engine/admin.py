"""AI Engine — Django admin registrations."""

from django.contrib import admin
from .models import Zone, DetectionEvent, SafetyViolation


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'risk_category', 'location', 'is_active', 'created_at']
    list_filter = ['risk_category', 'is_active']
    search_fields = ['name', 'location']
    ordering = ['name']


class SafetyViolationInline(admin.TabularInline):
    model = SafetyViolation
    extra = 0
    readonly_fields = ['violation_type', 'confidence_score', 'risk_level', 'timestamp']
    can_delete = False


@admin.register(DetectionEvent)
class DetectionEventAdmin(admin.ModelAdmin):
    list_display = ['id', 'status', 'zone', 'processing_time_ms', 'created_by', 'created_at']
    list_filter = ['status', 'zone']
    search_fields = ['created_by__username']
    readonly_fields = ['detection_results', 'processing_time_ms', 'created_at']
    inlines = [SafetyViolationInline]
    ordering = ['-created_at']


@admin.register(SafetyViolation)
class SafetyViolationAdmin(admin.ModelAdmin):
    list_display = ['id', 'violation_type', 'risk_level', 'confidence_score', 'zone', 'timestamp']
    list_filter = ['violation_type', 'risk_level', 'zone']
    search_fields = ['zone__name']
    readonly_fields = ['detection_event', 'bounding_box', 'timestamp']
    ordering = ['-timestamp']
