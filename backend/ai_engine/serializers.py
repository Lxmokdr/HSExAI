"""
AI Engine — Serializers
"""

from rest_framework import serializers
from .models import Zone, DetectionEvent, SafetyViolation


# ─────────────────────────────────────────────────────────────────────────────
# Zone
# ─────────────────────────────────────────────────────────────────────────────

class ZoneSerializer(serializers.ModelSerializer):
    violation_count = serializers.SerializerMethodField()

    class Meta:
        model = Zone
        fields = [
            'id', 'name', 'description', 'risk_category',
            'location', 'is_active', 'violation_count',
            'required_ppe_rules', 'compliance_threshold',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_violation_count(self, obj):
        return obj.violations.count()


# ─────────────────────────────────────────────────────────────────────────────
# Safety Violation
# ─────────────────────────────────────────────────────────────────────────────

class SafetyViolationSerializer(serializers.ModelSerializer):
    violation_type_display = serializers.CharField(
        source='get_violation_type_display', read_only=True
    )
    risk_level_display = serializers.CharField(
        source='get_risk_level_display', read_only=True
    )
    zone_name = serializers.CharField(source='zone.name', read_only=True, default=None)
    event_id = serializers.IntegerField(source='detection_event.id', read_only=True)

    class Meta:
        model = SafetyViolation
        fields = [
            'id', 'event_id', 'violation_type', 'violation_type_display',
            'confidence_score', 'risk_level', 'risk_level_display',
            'bounding_box', 'zone', 'zone_name', 'notes', 'timestamp',
            'severity', 'required_ppe', 'detected_ppe', 'ai_summary', 'zone_risk',
        ]
        read_only_fields = ['id', 'timestamp']


# ─────────────────────────────────────────────────────────────────────────────
# Detection Event
# ─────────────────────────────────────────────────────────────────────────────

class DetectionEventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    zone_name = serializers.CharField(source='zone.name', read_only=True, default=None)
    violation_count = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True, default=None
    )
    original_image_url = serializers.SerializerMethodField()
    annotated_image_url = serializers.SerializerMethodField()

    class Meta:
        model = DetectionEvent
        fields = [
            'id', 'status', 'zone', 'zone_name',
            'original_image_url', 'annotated_image_url',
            'violation_count', 'processing_time_ms',
            'risk_score', 'compliance_status',
            'created_by_username', 'created_at',
        ]

    def get_violation_count(self, obj):
        return obj.violations.count()

    def _build_absolute_uri(self, request, path):
        if not path:
            return None
        if request:
            return request.build_absolute_uri(f'/media/{path}')
        return f'/media/{path}'

    def get_original_image_url(self, obj):
        request = self.context.get('request')
        return self._build_absolute_uri(request, str(obj.original_image)) if obj.original_image else None

    def get_annotated_image_url(self, obj):
        request = self.context.get('request')
        return self._build_absolute_uri(request, str(obj.annotated_image)) if obj.annotated_image else None


class DetectionEventDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail/create responses."""
    zone_name = serializers.CharField(source='zone.name', read_only=True, default=None)
    violations = SafetyViolationSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True, default=None
    )
    compliance_rate = serializers.FloatField(read_only=True)
    original_image_url = serializers.SerializerMethodField()
    annotated_image_url = serializers.SerializerMethodField()

    class Meta:
        model = DetectionEvent
        fields = [
            'id', 'status', 'zone', 'zone_name',
            'original_image_url', 'annotated_image_url',
            'detection_results', 'violations', 'compliance_rate',
            'processing_time_ms', 'error_message',
            'risk_score', 'compliance_status', 'ai_summary',
            'created_by_username', 'created_at',
        ]

    def _build_absolute_uri(self, request, path):
        if not path:
            return None
        if request:
            return request.build_absolute_uri(f'/media/{path}')
        return f'/media/{path}'

    def get_original_image_url(self, obj):
        request = self.context.get('request')
        return self._build_absolute_uri(request, str(obj.original_image)) if obj.original_image else None

    def get_annotated_image_url(self, obj):
        request = self.context.get('request')
        return self._build_absolute_uri(request, str(obj.annotated_image)) if obj.annotated_image else None


# ─────────────────────────────────────────────────────────────────────────────
# Upload / Detection request
# ─────────────────────────────────────────────────────────────────────────────

class DetectionRequestSerializer(serializers.Serializer):
    """Validates multipart image upload payload."""
    image = serializers.ImageField(required=True)
    zone_id = serializers.IntegerField(required=False, allow_null=True)
    confidence_threshold = serializers.FloatField(
        required=False, default=0.35, min_value=0.05, max_value=0.95
    )


# ─────────────────────────────────────────────────────────────────────────────
# Statistics
# ─────────────────────────────────────────────────────────────────────────────

class ComplianceStatsSerializer(serializers.Serializer):
    total_events = serializers.IntegerField()
    total_violations = serializers.IntegerField()
    compliance_rate = serializers.FloatField()
    violations_by_type = serializers.DictField(child=serializers.IntegerField())
    violations_by_risk = serializers.DictField(child=serializers.IntegerField())
    violations_by_day = serializers.ListField(child=serializers.DictField())
    top_zones = serializers.ListField(child=serializers.DictField())
