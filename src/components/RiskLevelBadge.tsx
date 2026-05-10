import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface RiskLevelBadgeProps {
  level?: string | null;
  score?: number | null;
  className?: string;
  showScore?: boolean;
}

export const RiskLevelBadge: React.FC<RiskLevelBadgeProps> = ({ 
  level, 
  score, 
  className = '',
  showScore = false 
}) => {
  const getBadgeStyle = () => {
    switch (level?.toUpperCase()) {
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIcon = () => {
    switch (level?.toUpperCase()) {
      case 'LOW':
        return <CheckCircle className="w-3.5 h-3.5 mr-1" />;
      case 'MEDIUM':
        return <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      case 'HIGH':
        return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 mr-1" />;
    }
  };

  const getLabel = () => {
    switch (level?.toUpperCase()) {
      case 'LOW': return 'Faible';
      case 'MEDIUM': return 'Moyen';
      case 'HIGH': return 'Élevé';
      default: return 'Inconnu';
    }
  };

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()} ${className}`}>
      {getIcon()}
      <span>
        {getLabel()}
        {showScore && score !== undefined && score !== null && (
          <span className="ml-1 opacity-75">({(score * 100).toFixed(0)}%)</span>
        )}
      </span>
    </div>
  );
};
