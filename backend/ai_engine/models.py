"""
AI Safety Engine — Django Models

Three new models are introduced:
  Zone             — monitored physical area (camera zone / work area)
  DetectionEvent   — one run of YOLOv8 on an uploaded image
  SafetyViolation  — a single PPE violation found in a DetectionEvent
"""

from django.db import models
from django.conf import settings
from django.utils import timezone


class Zone(models.Model):
    """Monitored physical zone / camera area."""

    RISK_CATEGORY_CHOICES = [
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
        ('critical', 'Critical Risk'),
    ]

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, default='')
    risk_category = models.CharField(
        max_length=20,
        choices=RISK_CATEGORY_CHOICES,
        default='medium',
    )
    location = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    
    # Phase 2 additions
    required_ppe_rules = models.JSONField(default=list, help_text="List of required PPE (helmet, vest, gloves, mask)")
    compliance_threshold = models.FloatField(default=80.0, help_text="Minimum compliance rate required")
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ai_zones'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.risk_category})"


class DetectionEvent(models.Model):
    """
    One complete YOLOv8 inference run on a single uploaded image.
    Stores both original and annotated images, plus raw JSON results.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    # Images — stored on local disk under MEDIA_ROOT
    original_image = models.ImageField(upload_to='detections/original/')
    annotated_image = models.ImageField(
        upload_to='detections/annotated/',
        null=True,
        blank=True,
    )

    # Raw inference output (list of detected objects)
    detection_results = models.JSONField(default=dict)

    # Performance
    processing_time_ms = models.FloatField(default=0.0)

    # Context
    zone = models.ForeignKey(
        Zone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='detection_events',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, default='')

    # Phase 2 additions
    risk_score = models.CharField(max_length=20, default='LOW', help_text="LOW, MEDIUM, HIGH, CRITICAL")
    compliance_status = models.BooleanField(default=True, help_text="True if compliant with zone rules")
    ai_summary = models.TextField(blank=True, default='')

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='detection_events',
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ai_detection_events'
        ordering = ['-created_at']

    def __str__(self):
        return f"DetectionEvent #{self.pk} — {self.status} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

    @property
    def compliance_rate(self):
        """Return compliance rate (0–100) based on violations."""
        violations = self.violations.all()
        if not violations.exists():
            return 100.0
        critical = violations.filter(risk_level='high').count()
        total = violations.count()
        # Simple: no high-risk violations → compliant
        if critical == 0:
            return max(0.0, round(100.0 - (total * 10), 1))
        return max(0.0, round(100.0 - (critical * 25) - (total * 5), 1))


class SafetyViolation(models.Model):
    """A single PPE compliance violation detected in a DetectionEvent."""

    VIOLATION_TYPE_CHOICES = [
        ('no_helmet', 'No Helmet / Hardhat'),
        ('no_vest', 'No Safety Vest'),
        ('no_mask', 'No Face Mask'),
        ('no_gloves', 'No Gloves'),
        ('no_shoes', 'No Safety Shoes'),
        ('no_glasses', 'No Eye Protection'),
        ('unauthorized_person', 'Unauthorized Person'),
        ('other', 'Other Violation'),
    ]

    RISK_LEVEL_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    detection_event = models.ForeignKey(
        DetectionEvent,
        on_delete=models.CASCADE,
        related_name='violations',
    )
    violation_type = models.CharField(max_length=30, choices=VIOLATION_TYPE_CHOICES)
    confidence_score = models.FloatField(help_text='Model confidence 0.0–1.0')
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, default='medium')

    # Bounding box of the offending object: {x1, y1, x2, y2, class_name}
    bounding_box = models.JSONField(default=dict)

    # Phase 2 additions
    severity = models.CharField(max_length=20, default='medium')
    required_ppe = models.JSONField(default=list)
    detected_ppe = models.JSONField(default=list)
    ai_summary = models.TextField(blank=True, default='')
    zone_risk = models.CharField(max_length=20, blank=True, default='')

    zone = models.ForeignKey(
        Zone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='violations',
    )
    notes = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ai_safety_violations'
        ordering = ['-timestamp']

    def __str__(self):
        return (
            f"{self.get_violation_type_display()} — "
            f"{self.risk_level.upper()} ({self.confidence_score:.0%})"
        )
