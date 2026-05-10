# Standard library imports
from datetime import timedelta

# Django imports
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from django.db.models import Q, Count, Sum, Avg, F
from django.utils import timezone

# Django REST Framework imports
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

# Local imports
from .models import User, HardwareIncident, SoftwareIncident, Report, Equipement
from .permissions import (
    CanModifyHardwareIncidents, CanModifySoftwareIncidents,
    CanAccessHardwareIncidents, CanAccessSoftwareIncidents
)
from .serializers import (
    UserSerializer, LoginSerializer, HardwareIncidentSerializer,
    SoftwareIncidentSerializer, ReportSerializer, EquipmentSerializer
)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return Response({'status': 'OK', 'message': 'Guardian Backend is running'})


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login endpoint with rate limiting and account lockout"""
    username = request.data.get('username')
    
    # Check if user exists and is locked
    if username:
        try:
            user = User.objects.get(username=username)
            # Check if account is locked
            try:
                if hasattr(user, 'locked_until') and user.locked_until:
                    if timezone.now() < user.locked_until:
                        remaining_time = (user.locked_until - timezone.now()).total_seconds() / 60
                        return Response(
                            {
                                'error': f'Compte verrouillé. Réessayez dans {int(remaining_time)} minutes.',
                                'locked': True,
                                'locked_until': user.locked_until.isoformat()
                            },
                            status=status.HTTP_403_FORBIDDEN
                        )
                    else:
                        # Lock expired, unlock the account
                        user.locked_until = None
                        user.failed_login_attempts = 0
                        user.save(update_fields=['locked_until', 'failed_login_attempts'])
            except Exception as e:
                # If there's an error checking lock status, log it but continue
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error checking account lock: {e}")
        except User.DoesNotExist:
            # Don't reveal if user exists - continue with authentication attempt
            pass
        except Exception as e:
            # Log error but don't reveal details to user
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in login pre-check: {e}")
            # Continue with login attempt
    
    # Log request data for debugging
    import logging
    logger = logging.getLogger(__name__)
    username = request.data.get('username', 'NOT PROVIDED')
    has_password = bool(request.data.get('password'))
    logger.info(f"Login attempt - Username: {username}, "
                f"Has password: {has_password}, "
                f"Content-Type: {request.content_type}, "
                f"Data keys: {list(request.data.keys())}")
    
    # Check if user exists (for debugging)
    if username and username != 'NOT PROVIDED':
        try:
            user = User.objects.get(username=username)
            logger.info(f"User '{username}' exists. is_active: {user.is_active}, "
                       f"has_password_set: {bool(user.password)}")
        except User.DoesNotExist:
            logger.warning(f"User '{username}' does not exist in database!")
    
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Reset failed login attempts on successful login
        try:
            failed_attempts = getattr(user, 'failed_login_attempts', 0) or 0
            if failed_attempts > 0:
                if hasattr(user, 'reset_login_attempts'):
                    user.reset_login_attempts()
                else:
                    # Fallback if method doesn't exist
                    user.failed_login_attempts = 0
                    if hasattr(user, 'locked_until'):
                        user.locked_until = None
                    user.save(update_fields=['failed_login_attempts', 'locked_until'])
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error resetting login attempts: {e}")
        
        refresh = RefreshToken.for_user(user)
        token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        user_data = UserSerializer(user).data
        return Response({
            'token': token,
            'refresh_token': refresh_token,
            'user': user_data,
            'message': 'Connexion réussie'
        })
    else:
        # Serializer validation failed - return validation errors
        # Check if it's an authentication error (invalid credentials)
        # or a validation error (missing fields, etc.)
        error_response = serializer.errors
        
        # If it's an authentication error (invalid credentials), increment failed attempts
        if 'non_field_errors' in error_response or any('Identifiants invalides' in str(err) for err in error_response.values()):
            if username:
                try:
                    user = User.objects.get(username=username)
                    try:
                        if hasattr(user, 'increment_failed_attempts'):
                            user.increment_failed_attempts()
                            user.refresh_from_db()
                            if hasattr(user, 'locked_until') and user.locked_until:
                                if timezone.now() < user.locked_until:
                                    remaining_time = (user.locked_until - timezone.now()).total_seconds() / 60
                                    return Response(
                                        {
                                            'error': f'Compte verrouillé après 5 tentatives échouées. Réessayez dans {int(remaining_time)} minutes.',
                                            'locked': True,
                                            'locked_until': user.locked_until.isoformat()
                                        },
                                        status=status.HTTP_403_FORBIDDEN
                                    )
                    except Exception as e:
                        # Log error but don't reveal details
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Error incrementing failed attempts: {e}")
                except User.DoesNotExist:
                    pass
                except Exception as e:
                    # Log error but don't reveal details
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error in failed login handling: {e}")
        
        # Log validation errors for debugging
        logger.warning(f"Login validation failed: {error_response}")
        
        # Return validation errors from serializer
        return Response(
            error_response,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout endpoint"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
    except Exception:
        pass  # Token might already be blacklisted or invalid
    return Response({'message': 'Déconnexion réussie'})


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Refresh access token endpoint"""
    refresh_token = request.data.get('refresh_token')
    if not refresh_token:
        return Response(
            {'error': 'Refresh token requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        token = RefreshToken(refresh_token)
        access_token = str(token.access_token)
        
        # Rotate refresh token
        new_refresh_token = RefreshToken.for_user(token.user)
        token.blacklist()  # Blacklist old refresh token
        
        return Response({
            'token': access_token,
            'refresh_token': str(new_refresh_token),
        })
    except Exception as e:
        return Response(
            {'error': 'Token invalide ou expiré'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get user profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not old_password or not new_password:
        return Response(
            {'error': 'Ancien mot de passe et nouveau mot de passe requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if new_password != confirm_password:
        return Response(
            {'error': 'Les nouveaux mots de passe ne correspondent pas'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.check_password(old_password):
        return Response(
            {'error': 'Ancien mot de passe incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Mot de passe modifié avec succès'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def train_risk_model(request):
    """
    Train the AI risk prediction model
    
    This endpoint triggers training of the Random Forest model on historical incident data.
    Only accessible to superadmin users.
    
    Returns training metrics and feature importance.
    """
    # Check if user is superadmin
    if request.user.role != 'superadmin':
        return Response(
            {'error': 'Accès non autorisé. Superadmin requis.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from .services.ml_model import train_risk_model as train_model
    
    logger = __import__('logging').getLogger(__name__)
    logger.info(f"Starting model training - triggered by {request.user.username}")
    
    try:
        result = train_model()
        
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'status': 'success',
            'message': '✅ Model trained successfully',
            'metrics': {
                'train_accuracy': result.get('train_accuracy', 0),
                'test_accuracy': result.get('test_accuracy', 0),
                'n_samples': result.get('n_samples', 0),
                'n_high_risk': result.get('n_high_risk', 0),
            },
            'feature_importance': result.get('feature_importance', {}),
        })
    
    except Exception as e:
        logger.error(f"Model training error: {e}")
        return Response(
            {'error': f'Training failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class IncidentViewSet(viewsets.ModelViewSet):
    """ViewSet for handling incidents"""
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Return appropriate permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'update_hardware', 'update_software']:
            # Use modification permissions for write operations
            if self.request.data.get('incident_type') == 'hardware' or self.action == 'update_hardware':
                return [IsAuthenticated(), CanModifyHardwareIncidents()]
            elif self.request.data.get('incident_type') == 'software' or self.action == 'update_software':
                return [IsAuthenticated(), CanModifySoftwareIncidents()]
            else:
                return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter queryset based on user role"""
        user_role = self.request.user.role
        incident_type = self.request.query_params.get('type')
        
        # Superadmin can see everything
        if user_role == 'superadmin':
            if incident_type == 'hardware':
                return HardwareIncident.objects.select_related().all()
            elif incident_type == 'software':
                return SoftwareIncident.objects.all()
            return None
        
        # Chef de département can see both types (read-only)
        if user_role == 'chef_departement':
            if incident_type == 'hardware':
                return HardwareIncident.objects.select_related().all()
            elif incident_type == 'software':
                return SoftwareIncident.objects.all()
            return None
        
        # service_maintenance can only see hardware
        if user_role == 'service_maintenance':
            if incident_type == 'hardware' or not incident_type:
                return HardwareIncident.objects.select_related().all()
            return HardwareIncident.objects.none()
        
        # service_integration can only see software
        if user_role == 'service_integration':
            if incident_type == 'software' or not incident_type:
                return SoftwareIncident.objects.all()
            return SoftwareIncident.objects.none()
        
        return None
    
    def list(self, request):
        """List incidents with optional type filter and role-based filtering"""
        user_role = request.user.role
        incident_type = request.query_params.get('type')
        
        # Superadmin can see everything
        if user_role == 'superadmin':
            if incident_type == 'hardware':
                incidents = HardwareIncident.objects.all()
                serializer = HardwareIncidentSerializer(incidents, many=True)
                return Response({'results': serializer.data, 'count': len(serializer.data)})
            elif incident_type == 'software':
                incidents = SoftwareIncident.objects.all()
                serializer = SoftwareIncidentSerializer(incidents, many=True)
                return Response({'results': serializer.data, 'count': len(serializer.data)})
            else:
                # Get both types
                hardware_incidents = HardwareIncident.objects.all()
                software_incidents = SoftwareIncident.objects.all()
                hardware_data = HardwareIncidentSerializer(hardware_incidents, many=True).data
                software_data = SoftwareIncidentSerializer(software_incidents, many=True).data
                all_incidents = hardware_data + software_data
                return Response({'results': all_incidents, 'count': len(all_incidents)})
        
        # Chef de département can see both types (read-only)
        if user_role == 'chef_departement':
            if incident_type == 'hardware':
                incidents = HardwareIncident.objects.all()
                serializer = HardwareIncidentSerializer(incidents, many=True)
                return Response({'results': serializer.data, 'count': len(serializer.data)})
            elif incident_type == 'software':
                incidents = SoftwareIncident.objects.all()
                serializer = SoftwareIncidentSerializer(incidents, many=True)
                return Response({'results': serializer.data, 'count': len(serializer.data)})
            else:
                # Get both types
                hardware_incidents = HardwareIncident.objects.all()
                software_incidents = SoftwareIncident.objects.all()
                hardware_data = HardwareIncidentSerializer(hardware_incidents, many=True).data
                software_data = SoftwareIncidentSerializer(software_incidents, many=True).data
            all_incidents = hardware_data + software_data
            return Response({'results': all_incidents, 'count': len(all_incidents)})
        
        # service_maintenance can only see hardware
        if user_role == 'service_maintenance':
            if incident_type == 'software':
                return Response(
                    {'error': 'Accès non autorisé aux incidents logiciels'},
                    status=status.HTTP_403_FORBIDDEN
                )
            incidents = HardwareIncident.objects.all()
            serializer = HardwareIncidentSerializer(incidents, many=True)
            return Response({'results': serializer.data, 'count': len(serializer.data)})
        
        # service_integration can only see software
        if user_role == 'service_integration':
            if incident_type == 'hardware':
                return Response(
                    {'error': 'Accès non autorisé aux incidents matériels'},
                    status=status.HTTP_403_FORBIDDEN
                )
            incidents = SoftwareIncident.objects.all()
            serializer = SoftwareIncidentSerializer(incidents, many=True)
            return Response({'results': serializer.data, 'count': len(serializer.data)})
        
        return Response({'results': [], 'count': 0})
    
    def create(self, request):
        """Create a new incident"""
        incident_type = request.data.get('incident_type')
        user_role = request.user.role
        
        # Check permissions
        if incident_type == 'hardware':
            if user_role not in ['service_maintenance', 'superadmin']:
                return Response(
                    {'error': 'Accès non autorisé pour créer des incidents matériels'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif incident_type == 'software':
            if user_role not in ['service_integration', 'superadmin']:
                return Response(
                    {'error': 'Accès non autorisé pour créer des incidents logiciels'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        if incident_type == 'hardware':
            # Handle equipment lookup and update if name changed
            numero_de_serie = request.data.get('numero_de_serie', '').strip() if request.data.get('numero_de_serie') else ''
            nom_de_equipement = request.data.get('nom_de_equipement', '').strip() if request.data.get('nom_de_equipement') else ''
            partition = request.data.get('partition', '').strip() if request.data.get('partition') else ''
            equipement_id = None
            
            if numero_de_serie:
                # Try to find equipment with etat='actuel' first
                equip = Equipement.objects.filter(
                    num_serie__iexact=numero_de_serie,
                    etat='actuel'
                ).order_by('-created_at').first()
                
                if not equip:
                    # Try without etat condition
                    equip = Equipement.objects.filter(
                        num_serie__iexact=numero_de_serie
                    ).order_by('-created_at').first()
                
                if equip:
                    # Check if equipment name or partition changed
                    if nom_de_equipement and (equip.nom_equipement != nom_de_equipement or (partition and equip.partition != partition)):
                        # Mark current equipment as historique
                        latest_equip = Equipement.objects.filter(
                            num_serie__iexact=numero_de_serie,
                            etat='actuel'
                        ).order_by('-created_at').first()
                        
                        if latest_equip:
                            latest_equip.etat = 'historique'
                            latest_equip.save()
                        
                        # Create new equipment with updated name/partition
                        new_equipment = Equipement.objects.create(
                            num_serie=numero_de_serie,
                            nom_equipement=nom_de_equipement,
                            partition=partition or equip.partition,
                            etat='actuel'
                        )
                        equipement_id = new_equipment.id
                    else:
                        # No change, use existing equipment
                        equipement_id = equip.id
            
            data = request.data.copy()
            data['equipement_id'] = equipement_id
            
            serializer = HardwareIncidentSerializer(data=data)
            if serializer.is_valid():
                # Validate required fields
                nom_equipement = serializer.validated_data.get('nom_de_equipement', '')
                description = serializer.validated_data.get('description', '')
                
                if not nom_equipement or (isinstance(nom_equipement, str) and not nom_equipement.strip()):
                    return Response(
                        {'message': 'Le nom de l\'équipement est requis'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if not description or (isinstance(description, str) and not description.strip()):
                    return Response(
                        {'message': 'La description est requise'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                incident = serializer.save()
                return Response(
                    HardwareIncidentSerializer(incident).data,
                    status=status.HTTP_201_CREATED
                )
            # Return detailed validation errors
            return Response(
                {'message': 'Erreur de validation', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        elif incident_type == 'software':
            serializer = SoftwareIncidentSerializer(data=request.data)
            if serializer.is_valid():
                # Validate required fields
                description = serializer.validated_data.get('description', '')
                if not description or (isinstance(description, str) and not description.strip()):
                    return Response(
                        {'message': 'La description est requise'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                incident = serializer.save()
                return Response(
                    SoftwareIncidentSerializer(incident).data,
                    status=status.HTTP_201_CREATED
                )
            # Return detailed validation errors
            return Response(
                {'message': 'Erreur de validation', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        else:
            return Response(
                {'message': 'Type d\'incident invalide. Utilisez "hardware" ou "software".'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def retrieve(self, request, pk=None):
        """Get a single incident"""
        # Try hardware first
        try:
            incident = HardwareIncident.objects.get(pk=pk)
            serializer = HardwareIncidentSerializer(incident)
            return Response(serializer.data)
        except HardwareIncident.DoesNotExist:
            try:
                incident = SoftwareIncident.objects.get(pk=pk)
                serializer = SoftwareIncidentSerializer(incident)
                return Response(serializer.data)
            except SoftwareIncident.DoesNotExist:
                return Response(
                    {'message': 'Incident non trouvé'},
                    status=status.HTTP_404_NOT_FOUND
                )
    
    def update(self, request, pk=None):
        """Update an incident - generic handler"""
        user_role = request.user.role
        
        # Check if user can modify incidents (chef_departement is read-only)
        if user_role == 'chef_departement':
            return Response(
                {'error': 'Accès en lecture seule. Modification non autorisée.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Try hardware first
        try:
            incident = HardwareIncident.objects.get(pk=pk)
            # Check if user can modify hardware incidents
            if user_role not in ['service_maintenance', 'superadmin']:
                return Response(
                    {'error': 'Accès non autorisé pour modifier des incidents matériels'},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Handle equipment lookup and update if name changed
            numero_de_serie = request.data.get('numero_de_serie', '').strip() if request.data.get('numero_de_serie') else ''
            nom_de_equipement = request.data.get('nom_de_equipement', '').strip() if request.data.get('nom_de_equipement') else ''
            partition = request.data.get('partition', '').strip() if request.data.get('partition') else ''
            equipement_id = None
            
            if numero_de_serie:
                # Try to find equipment with etat='actuel' first
                equip = Equipement.objects.filter(
                    num_serie__iexact=numero_de_serie,
                    etat='actuel'
                ).order_by('-created_at').first()
                
                if not equip:
                    # Try without etat condition
                    equip = Equipement.objects.filter(
                        num_serie__iexact=numero_de_serie
                    ).order_by('-created_at').first()
                
                if equip:
                    # Check if equipment name or partition changed
                    if nom_de_equipement and (equip.nom_equipement != nom_de_equipement or (partition and equip.partition != partition)):
                        # Mark current equipment as historique
                        latest_equip = Equipement.objects.filter(
                            num_serie__iexact=numero_de_serie,
                            etat='actuel'
                        ).order_by('-created_at').first()
                        
                        if latest_equip:
                            latest_equip.etat = 'historique'
                            latest_equip.save()
                        
                        # Create new equipment with updated name/partition
                        new_equipment = Equipement.objects.create(
                            num_serie=numero_de_serie,
                            nom_equipement=nom_de_equipement,
                            partition=partition or equip.partition,
                            etat='actuel'
                        )
                        equipement_id = new_equipment.id
                    else:
                        # No change, use existing equipment
                        equipement_id = equip.id
            
            data = request.data.copy()
            data['equipement_id'] = equipement_id
            data['incident_type'] = 'hardware'
            
            serializer = HardwareIncidentSerializer(incident, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except HardwareIncident.DoesNotExist:
            try:
                incident = SoftwareIncident.objects.get(pk=pk)
                data = request.data.copy()
                data['incident_type'] = 'software'
                serializer = SoftwareIncidentSerializer(incident, data=data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except SoftwareIncident.DoesNotExist:
                return Response(
                    {'message': 'Incident non trouvé'},
                    status=status.HTTP_404_NOT_FOUND
                )
    
    def update_hardware(self, request, pk=None):
        """Update a hardware incident"""
        user_role = request.user.role
        
        # Check permissions
        if user_role == 'chef_departement':
            return Response(
                {'error': 'Accès en lecture seule. Modification non autorisée.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if user_role not in ['service_maintenance', 'superadmin']:
            return Response(
                {'error': 'Accès non autorisé pour modifier des incidents matériels'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            incident = HardwareIncident.objects.get(pk=pk)
        except HardwareIncident.DoesNotExist:
            return Response(
                {'message': 'Incident matériel non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Handle equipment lookup
        numero_de_serie = request.data.get('numero_de_serie', '').strip() if request.data.get('numero_de_serie') else ''
        equipement_id = None
        
        if numero_de_serie:
            equip = Equipement.objects.filter(
                num_serie__iexact=numero_de_serie,
                etat='actuel'
            ).order_by('-created_at').first()
            
            if not equip:
                equip = Equipement.objects.filter(
                    num_serie__iexact=numero_de_serie
                ).order_by('-created_at').first()
            
            if equip:
                equipement_id = equip.id
        
        data = request.data.copy()
        data['equipement_id'] = equipement_id
        data['incident_type'] = 'hardware'
        
        serializer = HardwareIncidentSerializer(incident, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update_software(self, request, pk=None):
        """Update a software incident"""
        user_role = request.user.role
        
        # Check permissions
        if user_role == 'chef_departement':
            return Response(
                {'error': 'Accès en lecture seule. Modification non autorisée.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if user_role not in ['service_integration', 'superadmin']:
            return Response(
                {'error': 'Accès non autorisé pour modifier des incidents logiciels'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            incident = SoftwareIncident.objects.get(pk=pk)
        except SoftwareIncident.DoesNotExist:
            return Response(
                {'message': 'Incident logiciel non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = request.data.copy()
        data['incident_type'] = 'software'
        serializer = SoftwareIncidentSerializer(incident, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """Delete an incident"""
        user_role = request.user.role
        
        # Check permissions - chef_departement cannot delete
        if user_role == 'chef_departement':
            return Response(
                {'error': 'Accès en lecture seule. Suppression non autorisée.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Try hardware first
        try:
            incident = HardwareIncident.objects.get(pk=pk)
            # Check if user can delete hardware incidents
            if user_role not in ['service_maintenance', 'superadmin']:
                return Response(
                    {'error': 'Accès non autorisé pour supprimer des incidents matériels'},
                    status=status.HTTP_403_FORBIDDEN
                )
            incident.delete()
            return Response({'message': 'Incident matériel supprimé avec succès'})
        except HardwareIncident.DoesNotExist:
            try:
                incident = SoftwareIncident.objects.get(pk=pk)
                # Check if user can delete software incidents
                if user_role not in ['service_integration', 'superadmin']:
                    return Response(
                        {'error': 'Accès non autorisé pour supprimer des incidents logiciels'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                # Delete associated report if exists
                Report.objects.filter(software_incident=incident).delete()
                incident.delete()
                return Response({'message': 'Incident logiciel supprimé avec succès'})
            except SoftwareIncident.DoesNotExist:
                return Response(
                    {'message': 'Incident non trouvé'},
                    status=status.HTTP_404_NOT_FOUND
                )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get incident statistics filtered by role"""
        user_role = request.user.role
        
        # Filter based on role
        if user_role == 'service_maintenance':
            # Only hardware stats
            hardware_count = HardwareIncident.objects.count()
            hardware_downtime = HardwareIncident.objects.filter(
                duree_arret__isnull=False,
                duree_arret__gt=0
            ).aggregate(
                total=Sum('duree_arret'),
                avg=Avg('duree_arret'),
                count=Count('id')
            )
            total_downtime = hardware_downtime['total'] or 0
            avg_downtime = hardware_downtime['avg']
            if avg_downtime:
                avg_downtime = int(round(avg_downtime))
            else:
                avg_downtime = None
            downtime_count = hardware_downtime['count'] or 0
            downtime_percentage = int((downtime_count / hardware_count * 100)) if hardware_count > 0 else 0
            seven_days_ago = timezone.now().date() - timedelta(days=7)
            thirty_days_ago = timezone.now().date() - timedelta(days=30)
            hardware_last_7 = HardwareIncident.objects.filter(date__gte=seven_days_ago).count()
            hardware_last_30 = HardwareIncident.objects.filter(date__gte=thirty_days_ago).count()
            
            return Response({
                'total_incidents': hardware_count,
                'hardware_incidents': hardware_count,
                'software_incidents': 0,
                'hardware_downtime_minutes': int(total_downtime),
                'hardware_avg_downtime_minutes': avg_downtime,
                'hardware_incidents_with_downtime': downtime_count,
                'hardware_downtime_percentage': downtime_percentage,
                'hardware_last_7_days': hardware_last_7,
                'hardware_last_30_days': hardware_last_30,
                'software_last_7_days': 0,
                'software_last_30_days': 0,
            })
        
        elif user_role == 'service_integration':
            # Only software stats
            software_count = SoftwareIncident.objects.count()
            seven_days_ago = timezone.now().date() - timedelta(days=7)
            thirty_days_ago = timezone.now().date() - timedelta(days=30)
            software_last_7 = SoftwareIncident.objects.filter(date__gte=seven_days_ago).count()
            software_last_30 = SoftwareIncident.objects.filter(date__gte=thirty_days_ago).count()
            
            return Response({
                'total_incidents': software_count,
                'hardware_incidents': 0,
                'software_incidents': software_count,
                'hardware_downtime_minutes': 0,
                'hardware_avg_downtime_minutes': None,
                'hardware_incidents_with_downtime': 0,
                'hardware_downtime_percentage': 0,
                'hardware_last_7_days': 0,
                'hardware_last_30_days': 0,
                'software_last_7_days': software_last_7,
                'software_last_30_days': software_last_30,
            })
        
        # superadmin and chef_departement see all stats
        hardware_count = HardwareIncident.objects.count()
        software_count = SoftwareIncident.objects.count()
        
        hardware_downtime = HardwareIncident.objects.filter(
            duree_arret__isnull=False,
            duree_arret__gt=0
        ).aggregate(
            total=Sum('duree_arret'),
            avg=Avg('duree_arret'),
            count=Count('id')
        )
        
        total_downtime = hardware_downtime['total'] or 0
        avg_downtime = hardware_downtime['avg']
        if avg_downtime:
            avg_downtime = int(round(avg_downtime))
        else:
            avg_downtime = None
        
        downtime_count = hardware_downtime['count'] or 0
        downtime_percentage = int((downtime_count / hardware_count * 100)) if hardware_count > 0 else 0
        
        seven_days_ago = timezone.now().date() - timedelta(days=7)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        
        hardware_last_7 = HardwareIncident.objects.filter(date__gte=seven_days_ago).count()
        hardware_last_30 = HardwareIncident.objects.filter(date__gte=thirty_days_ago).count()
        software_last_7 = SoftwareIncident.objects.filter(date__gte=seven_days_ago).count()
        software_last_30 = SoftwareIncident.objects.filter(date__gte=thirty_days_ago).count()
        
        stats = {
            'total_incidents': hardware_count + software_count,
            'hardware_incidents': hardware_count,
            'software_incidents': software_count,
            'hardware_downtime_minutes': int(total_downtime),
            'hardware_avg_downtime_minutes': avg_downtime,
            'hardware_incidents_with_downtime': downtime_count,
            'hardware_downtime_percentage': downtime_percentage,
            'hardware_last_7_days': hardware_last_7,
            'hardware_last_30_days': hardware_last_30,
            'software_last_7_days': software_last_7,
            'software_last_30_days': software_last_30,
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent incidents filtered by role"""
        user_role = request.user.role
        
        if user_role == 'service_maintenance':
            # Only hardware incidents
            hardware_recent = HardwareIncident.objects.all()[:5]
            hardware_data = HardwareIncidentSerializer(hardware_recent, many=True).data
            return Response(hardware_data)
        
        elif user_role == 'service_integration':
            # Only software incidents
            software_recent = SoftwareIncident.objects.all()[:5]
            software_data = SoftwareIncidentSerializer(software_recent, many=True).data
            return Response(software_data)
        
        # superadmin and chef_departement see both
        hardware_recent = HardwareIncident.objects.all()[:5]
        software_recent = SoftwareIncident.objects.all()[:5]
        
        hardware_data = HardwareIncidentSerializer(hardware_recent, many=True).data
        software_data = SoftwareIncidentSerializer(software_recent, many=True).data
        
        all_incidents = hardware_data + software_data
        # Sort by created_at descending
        all_incidents.sort(key=lambda x: x['created_at'], reverse=True)
        
        return Response(all_incidents[:5])


class ReportViewSet(viewsets.ModelViewSet):
    """ViewSet for handling reports"""
    permission_classes = [IsAuthenticated]
    serializer_class = ReportSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action"""
        from .permissions import CanModifyReports
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), CanModifyReports()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter queryset based on user role"""
        user_role = self.request.user.role
        
        # service_integration and superadmin can see all reports
        # chef_departement can see all reports (read-only)
        queryset = Report.objects.all()
        incident_id = self.request.query_params.get('incident')
        if incident_id:
            queryset = queryset.filter(software_incident_id=incident_id)
        return queryset
    
    def list(self, request):
        """List reports"""
        user_role = request.user.role
        
        # Check if user can access reports
        if user_role not in ['service_integration', 'chef_departement', 'superadmin']:
            return Response(
                {'error': 'Accès non autorisé aux rapports'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})
    
    def create(self, request):
        """Create or update a report"""
        user_role = request.user.role
        
        # Check permissions
        if user_role == 'chef_departement':
            return Response(
                {'error': 'Accès en lecture seule. Création non autorisée.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if user_role not in ['service_integration', 'superadmin']:
            return Response(
                {'error': 'Accès non autorisé pour créer des rapports'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ReportSerializer(data=request.data)
        if serializer.is_valid():
            report = serializer.save()
            return Response(
                ReportSerializer(report).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Update a report"""
        user_role = request.user.role
        
        if user_role == 'chef_departement':
            return Response(
                {'error': 'Accès en lecture seule. Modification non autorisée.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if user_role not in ['service_integration', 'superadmin']:
            return Response(
                {'error': 'Accès non autorisé pour modifier des rapports'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a report"""
        user_role = request.user.role
        
        if user_role == 'chef_departement':
            return Response(
                {'error': 'Accès en lecture seule. Suppression non autorisée.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if user_role not in ['service_integration', 'superadmin']:
            return Response(
                {'error': 'Accès non autorisé pour supprimer des rapports'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class EquipmentViewSet(viewsets.ModelViewSet):
    """ViewSet for handling equipment"""
    permission_classes = [IsAuthenticated]
    serializer_class = EquipmentSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action"""
        from .permissions import CanModifyEquipment
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), CanModifyEquipment()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter queryset based on user role"""
        user_role = self.request.user.role
        
        # service_integration cannot access equipment
        if user_role == 'service_integration':
            return Equipement.objects.none()
        
        # Others can access (with read-only for chef_departement)
        queryset = Equipement.objects.all()
        num_serie = self.request.query_params.get('num_serie')
        search_serie = self.request.query_params.get('search_serie')
        
        if search_serie:
            # Return distinct serial numbers for autocomplete
            serials = Equipement.objects.filter(
                num_serie__icontains=search_serie,
                num_serie__isnull=False
            ).values_list('num_serie', flat=True).distinct()[:10]
            return list(serials)
        
        if num_serie:
            # Get current equipment with this serial number
            trimmed_serial = num_serie.strip()
            queryset = Equipement.objects.filter(
                num_serie__iexact=trimmed_serial,
                etat='actuel'
            ).order_by('-created_at')
            
            if not queryset.exists():
                # Fallback without etat condition
                queryset = Equipement.objects.filter(
                    num_serie__iexact=trimmed_serial
                ).order_by('-created_at')
        
        return queryset
    
    def list(self, request):
        """List equipment"""
        user_role = request.user.role
        
        # Check if user can access equipment
        if user_role == 'service_integration':
            return Response(
                {'error': 'Accès non autorisé aux équipements'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        search_serie = request.query_params.get('search_serie')
        num_serie = request.query_params.get('num_serie')
        
        if search_serie:
            # Return serial numbers list
            serials = list(self.get_queryset())
            return Response({'results': serials, 'count': len(serials)})
        
        queryset = self.get_queryset()
        
        if num_serie:
            # Single result
            if queryset.exists():
                serializer = self.get_serializer(queryset.first())
                return Response(serializer.data)
            else:
                return Response(
                    {'message': 'Équipement non trouvé avec ce numéro de série'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Multiple results
            serializer = self.get_serializer(queryset, many=True)
            return Response({'results': serializer.data, 'count': len(serializer.data)})
    
    def create(self, request):
        """Create equipment"""
        user_role = request.user.role
        
        # Check permissions
        if user_role == 'chef_departement':
            return Response(
                {'error': 'Accès en lecture seule. Création non autorisée.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if user_role not in ['service_maintenance', 'superadmin']:
            return Response(
                {'error': 'Accès non autorisé pour créer des équipements'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = EquipmentSerializer(data=request.data)
        if serializer.is_valid():
            # Validate required fields
            if not serializer.validated_data.get('nom_equipement', '').strip():
                return Response(
                    {'message': 'Le nom de l\'équipement est requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not serializer.validated_data.get('partition', '').strip():
                return Response(
                    {'message': 'La partition est requise'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set default etat if not provided
            if 'etat' not in serializer.validated_data or not serializer.validated_data.get('etat'):
                serializer.validated_data['etat'] = 'actuel'
            
            equipment = serializer.save()
            return Response(
                EquipmentSerializer(equipment).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, pk=None):
        """Update equipment - creates new record with etat='actuel' and marks old one as 'historique'"""
        user_role = request.user.role
        
        # Check permissions
        if user_role == 'chef_departement':
            return Response(
                {'error': 'Accès en lecture seule. Modification non autorisée.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if user_role not in ['service_maintenance', 'superadmin']:
            return Response(
                {'error': 'Accès non autorisé pour modifier des équipements'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            existing_equipment = Equipement.objects.get(pk=pk)
        except Equipement.DoesNotExist:
            return Response(
                {'message': 'Équipement non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = EquipmentSerializer(data=request.data)
        if serializer.is_valid():
            # Validate required fields
            if not serializer.validated_data.get('nom_equipement', '').strip():
                return Response(
                    {'message': 'Le nom de l\'équipement est requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not serializer.validated_data.get('partition', '').strip():
                return Response(
                    {'message': 'La partition est requise'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            num_serie = serializer.validated_data.get('num_serie') or existing_equipment.num_serie
            
            # Find latest equipment with same serial and etat='actuel'
            latest_equip = Equipement.objects.filter(
                num_serie=num_serie,
                etat='actuel'
            ).order_by('-created_at').first()
            
            if latest_equip:
                # Mark as historique
                latest_equip.etat = 'historique'
                latest_equip.save()
            
            # Create new equipment with updated data
            new_equipment = Equipement.objects.create(
                num_serie=num_serie,
                nom_equipement=serializer.validated_data['nom_equipement'],
                partition=serializer.validated_data['partition'],
                etat='actuel'
            )
            
            return Response(EquipmentSerializer(new_equipment).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get all incidents related to a specific equipment"""
        try:
            equipment = Equipement.objects.get(pk=pk)
        except Equipement.DoesNotExist:
            return Response(
                {'message': 'Équipement non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all hardware incidents for this equipment (by equipement_id or serial number)
        hardware_incidents = HardwareIncident.objects.filter(
            Q(equipement_id=equipment.id) | 
            Q(numero_de_serie__iexact=equipment.num_serie)
        ).order_by('-date', '-time')
        
        hardware_data = HardwareIncidentSerializer(hardware_incidents, many=True).data
        
        # Get equipment info
        equipment_data = EquipmentSerializer(equipment).data
        
        return Response({
            'equipment': equipment_data,
            'incidents': hardware_data,
            'count': len(hardware_data)
        })
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def risk(self, request, pk=None):
        """
        Get AI-based risk prediction for equipment
        
        Returns:
        {
            'equipment_id': int,
            'risk_score': float (0-1),
            'risk_level': 'LOW' | 'MEDIUM' | 'HIGH',
            'confidence': float,
        }
        """
        try:
            equipment = Equipement.objects.get(pk=pk)
        except Equipement.DoesNotExist:
            return Response(
                {'error': 'Equipment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Import here to avoid circular imports
        from .services.ml_model import predict_equipment_risk
        
        # Get prediction from ML model
        prediction = predict_equipment_risk(pk)
        
        # Store/update in database if successful
        if 'error' not in prediction:
            from .models import RiskPrediction
            
            # Extract features for storage
            features = self._extract_risk_factors(equipment)
            
            risk_pred, _ = RiskPrediction.objects.update_or_create(
                equipement=equipment,
                defaults={
                    'risk_score': prediction['risk_score'],
                    'risk_level': prediction['risk_level'],
                    'confidence': prediction['confidence'],
                    **features,
                }
            )
        
        return Response(prediction)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def top_risks(self, request):
        """
        Get top N highest-risk equipment
        
        Query params:
        - n: number of top risks to return (default: 5)
        
        Returns:
        [
            {
                'equipment_id': int,
                'equipment_name': str,
                'risk_score': float,
                'risk_level': str,
            },
            ...
        ]
        """
        from .services.ml_model import predict_top_risks
        
        n = int(request.query_params.get('n', 5))
        n = min(n, 20)  # Cap at 20
        
        predictions = predict_top_risks(n)
        
        # Add equipment details
        result = []
        for pred in predictions:
            try:
                equipment = Equipement.objects.get(id=pred['equipment_id'])
                result.append({
                    **pred,
                    'equipment_name': equipment.nom_equipement,
                    'equipment_serial': equipment.num_serie,
                })
            except Equipement.DoesNotExist:
                result.append(pred)
        
        return Response({
            'count': len(result),
            'results': result,
        })
    
    def _extract_risk_factors(self, equipment):
        """Extract risk factors for storage in database"""
        from datetime import timedelta
        
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        hw_incidents = HardwareIncident.objects.filter(
            Q(equipement_id=equipment.id) | 
            Q(numero_de_serie=equipment.num_serie)
        )
        
        incident_count_30d = hw_incidents.filter(
            date__gte=thirty_days_ago.date()
        ).count()
        
        avg_downtime = hw_incidents.aggregate(
            avg=Avg('duree_arret')
        )['avg'] or 0
        avg_downtime_hours = max(0, (avg_downtime / 60)) if avg_downtime else 0
        
        latest = hw_incidents.order_by('-date').first()
        time_since_last = (now.date() - latest.date).days if latest else 365
        
        return {
            'incident_count_30d': incident_count_30d,
            'avg_downtime_hours': avg_downtime_hours,
            'time_since_last_incident_days': max(0, time_since_last),
            'hardware_incident_ratio': 0.7,  # Placeholder
        }



class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users - only accessible by superadmin"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def _check_superadmin(self, request):
        """Helper method to check if user is superadmin"""
        if request.user.role != 'superadmin':
            return Response(
                {'error': 'Accès non autorisé'},
                status=status.HTTP_403_FORBIDDEN
            )
        return None
    
    def get_queryset(self):
        """Only superadmin can access users"""
        if self.request.user.role != 'superadmin':
            return User.objects.none()
        return User.objects.all().order_by('-created_at')
    
    def list(self, request):
        """List all users"""
        check_result = self._check_superadmin(request)
        if check_result:
            return check_result
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})
    
    def create(self, request):
        """Create a new user"""
        check_result = self._check_superadmin(request)
        if check_result:
            return check_result
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                self.get_serializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Update a user"""
        check_result = self._check_superadmin(request)
        if check_result:
            return check_result
        
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response(self.get_serializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a user"""
        check_result = self._check_superadmin(request)
        if check_result:
            return check_result
        
        # Prevent deleting yourself
        instance = self.get_object()
        if instance.id == request.user.id:
            return Response(
                {'error': 'Vous ne pouvez pas supprimer votre propre compte'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)

