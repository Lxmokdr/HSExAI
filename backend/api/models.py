from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    """Custom user model with role field"""
    ROLE_CHOICES = [
        ('service_maintenance', 'Service Maintenance'),
        ('service_integration', 'Service Integration et Développement'),
        ('chef_departement', 'Chef de Département'),
        ('superadmin', 'Super Admin'),
    ]
    
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='service_maintenance')
    created_at = models.DateTimeField(default=timezone.now)
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'users'
    
    def is_locked(self):
        """Check if account is currently locked"""
        if not hasattr(self, 'locked_until') or self.locked_until is None:
            return False
        if timezone.now() < self.locked_until:
            return True
        # Unlock if lock period has passed
        self.locked_until = None
        self.failed_login_attempts = 0
        self.save(update_fields=['locked_until', 'failed_login_attempts'])
        return False
    
    def lock_account(self, duration_minutes=15):
        """Lock account for specified duration"""
        self.locked_until = timezone.now() + timedelta(minutes=duration_minutes)
        self.save(update_fields=['locked_until'])
    
    def reset_login_attempts(self):
        """Reset failed login attempts"""
        self.failed_login_attempts = 0
        self.locked_until = None
        self.save(update_fields=['failed_login_attempts', 'locked_until'])
    
    def increment_failed_attempts(self):
        """Increment failed login attempts and lock if threshold reached"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.lock_account(15)
        self.save(update_fields=['failed_login_attempts', 'locked_until'])


class Equipement(models.Model):
    """Equipment model"""
    num_serie = models.CharField(max_length=255, null=True, blank=True)
    nom_equipement = models.CharField(max_length=255)
    partition = models.CharField(max_length=255)
    etat = models.CharField(max_length=50, default='actuel')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'equipement'
        ordering = ['-created_at']


class HardwareIncident(models.Model):
    """Hardware incident model"""
    MAINTENANCE_TYPE_CHOICES = [
        ('preventive', 'Préventive'),
        ('corrective', 'Corrective'),
    ]
    
    date = models.DateField()
    time = models.TimeField()
    nom_de_equipement = models.CharField(max_length=255)
    partition = models.CharField(max_length=255, null=True, blank=True)
    numero_de_serie = models.CharField(max_length=255, null=True, blank=True)
    equipement_id = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    anomalie_observee = models.TextField(null=True, blank=True)
    action_realisee = models.TextField(null=True, blank=True)
    piece_de_rechange_utilisee = models.TextField(null=True, blank=True)
    etat_de_equipement_apres_intervention = models.TextField(null=True, blank=True)
    recommendation = models.TextField(null=True, blank=True)
    duree_arret = models.IntegerField(null=True, blank=True)
    maintenance_type = models.CharField(max_length=20, choices=MAINTENANCE_TYPE_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hardware_incidents'
        ordering = ['-created_at']


class SoftwareIncident(models.Model):
    """Software incident model"""
    date = models.DateField()
    time = models.TimeField()
    server = models.CharField(max_length=255, null=True, blank=True)
    partition = models.CharField(max_length=255, null=True, blank=True)
    position = models.CharField(max_length=255, null=True, blank=True)
    type_d_anomalie = models.CharField(max_length=255, null=True, blank=True)
    call_sign = models.CharField(max_length=255, null=True, blank=True)
    nom_radar = models.CharField(max_length=10, null=True, blank=True, choices=[
        ('OS', 'OS'),
        ('MG', 'MG'),
        ('SD', 'SD'),
        ('LO', 'LO'),
        ('BY', 'BY'),
    ])
    FL = models.CharField(max_length=255, null=True, blank=True)
    longitude = models.CharField(max_length=255, null=True, blank=True)
    latitude = models.CharField(max_length=255, null=True, blank=True)
    code_SSR = models.CharField(max_length=255, null=True, blank=True)
    sujet = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField()
    commentaires = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'software_incidents'
        ordering = ['-created_at']


class Report(models.Model):
    """Report model - one per software incident"""
    software_incident = models.OneToOneField(
        SoftwareIncident,
        on_delete=models.CASCADE,
        related_name='report'
    )
    date = models.DateField()
    time = models.TimeField()
    anomaly = models.TextField()
    analysis = models.TextField()
    conclusion = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']


class RiskPrediction(models.Model):
    """
    Risk prediction model for HSE - Predictive Safety Module
    Stores AI-based risk assessments for equipment
    """
    RISK_LEVEL_CHOICES = [
        ('LOW', 'Low Risk - Green'),
        ('MEDIUM', 'Medium Risk - Orange'),
        ('HIGH', 'High Risk - Red'),
    ]
    
    equipement = models.ForeignKey(
        Equipement,
        on_delete=models.CASCADE,
        related_name='risk_predictions'
    )
    risk_score = models.FloatField(
        help_text='Risk probability (0.0 to 1.0)'
    )
    risk_level = models.CharField(
        max_length=20,
        choices=RISK_LEVEL_CHOICES,
        help_text='LOW (<0.4), MEDIUM (0.4-0.7), HIGH (>0.7)'
    )
    confidence = models.FloatField(
        default=0.5,
        help_text='Model confidence in prediction (0.0 to 1.0)'
    )
    
    # Risk factors for explainability
    incident_count_30d = models.IntegerField(default=0)
    avg_downtime_hours = models.FloatField(default=0.0)
    time_since_last_incident_days = models.IntegerField(default=0)
    hardware_incident_ratio = models.FloatField(default=0.5)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'risk_predictions'
        ordering = ['-risk_score', '-created_at']
        indexes = [
            models.Index(fields=['equipement', '-created_at']),
            models.Index(fields=['-risk_score']),
        ]
    
    def __str__(self):
        return f"{self.equipement.nom_equipement} - {self.risk_level} ({self.risk_score:.2%})"

