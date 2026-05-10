"""
AI Engine — API Views (Phase 2)
"""

import logging
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Zone, DetectionEvent, SafetyViolation
from .serializers import (
    ZoneSerializer,
    DetectionEventListSerializer,
    DetectionEventDetailSerializer,
    SafetyViolationSerializer,
    DetectionRequestSerializer,
)
from .services.detection_service import run_detection
from .services.violation_service import (
    create_violations_from_detection,
    get_compliance_statistics,
)
from .services.analytics_service import (
    get_compliance_analytics,
    get_zone_risk_analytics,
    generate_safety_insights,
    get_executive_summary,
    get_ppe_distribution,
)

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def detect_image(request):
    """Enhanced Detection View."""
    req_serializer = DetectionRequestSerializer(data=request.data)
    if not req_serializer.is_valid():
        return Response(req_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    image_file = req_serializer.validated_data['image']
    zone_id = req_serializer.validated_data.get('zone_id')
    conf_threshold = req_serializer.validated_data.get('confidence_threshold', 0.35)

    zone = None
    if zone_id:
        zone = Zone.objects.filter(pk=zone_id, is_active=True).first()

    event = DetectionEvent.objects.create(
        original_image=image_file,
        zone=zone,
        status='processing',
        created_by=request.user,
    )

    try:
        detection_result = run_detection(
            image_file=image_file,
            confidence_threshold=conf_threshold,
            zone_id=zone_id,
        )
    except Exception as exc:
        event.status = 'failed'
        event.error_message = str(exc)
        event.save()
        return Response({'error': str(exc)}, status=500)

    if not detection_result.get('success'):
        event.status = 'failed'
        event.error_message = detection_result.get('error', 'Unknown error')
        event.save()
        return Response({'error': event.error_message}, status=422)

    # Save annotated image
    annotated_rel = detection_result.get('annotated_image_path')
    if annotated_rel:
        annotated_abs = Path(settings.MEDIA_ROOT) / annotated_rel
        if annotated_abs.exists():
            with open(annotated_abs, 'rb') as f:
                event.annotated_image.save(annotated_rel.split('/')[-1], ContentFile(f.read()), save=False)

    # Update event fields
    event.detection_results = detection_result.get('detected_objects', [])
    event.processing_time_ms = detection_result.get('processing_time_ms', 0.0)
    event.risk_score = detection_result.get('risk_score', 'LOW')
    event.compliance_status = detection_result.get('compliance_status', True)
    event.ai_summary = detection_result.get('ai_summary', '')
    event.status = 'completed'
    event.save()

    create_violations_from_detection(event, detection_result)

    serializer = DetectionEventDetailSerializer(event, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_compliance(request):
    return Response(get_compliance_analytics())

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_zones(request):
    return Response(get_zone_risk_analytics())

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def safety_insights(request):
    return Response(generate_safety_insights())

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def executive_summary(request):
    """Aggregate KPIs for the Flagship Dashboard."""
    return Response(get_executive_summary())

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ppe_distribution(request):
    """Counts of different violation types."""
    return Response(get_ppe_distribution())

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_events(request):
    qs = DetectionEvent.objects.select_related('zone', 'created_by').all()
    limit = int(request.query_params.get('limit', 20))
    offset = int(request.query_params.get('offset', 0))
    serializer = DetectionEventListSerializer(qs[offset:offset+limit], many=True, context={'request': request})
    return Response({'count': qs.count(), 'results': serializer.data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def event_detail(request, pk):
    event = DetectionEvent.objects.get(pk=pk)
    serializer = DetectionEventDetailSerializer(event, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_violations(request):
    qs = SafetyViolation.objects.all()
    serializer = SafetyViolationSerializer(qs[:50], many=True)
    return Response({'count': qs.count(), 'results': serializer.data})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def zones_list(request):
    if request.method == 'GET':
        zones = Zone.objects.all()
        return Response(ZoneSerializer(zones, many=True).data)
    serializer = ZoneSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def zone_detail(request, pk):
    zone = Zone.objects.get(pk=pk)
    if request.method == 'GET':
        return Response(ZoneSerializer(zone).data)
    elif request.method in ['PUT', 'PATCH']:
        serializer = ZoneSerializer(zone, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
    elif request.method == 'DELETE':
        zone.is_active = False
        zone.save()
        return Response(status=204)
    return Response(status=400)
