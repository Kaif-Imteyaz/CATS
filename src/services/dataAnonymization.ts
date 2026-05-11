/**
 * HIPAA-Compliant Data Anonymization Service
 * Anonymizes Protected Health Information (PHI) before storage
 */

import { createHash, randomBytes } from 'crypto';

// Salt for consistent anonymization within a session
const SESSION_SALT = randomBytes(32).toString('hex');

interface AnonymizationConfig {
  preserveFormat?: boolean;
  hashAlgorithm?: 'sha256' | 'sha512';
}

/**
 * Generate a consistent anonymous ID from a real identifier
 * Uses a one-way hash so original data cannot be recovered
 */
export function anonymizeId(realId: string, prefix: string = 'patient'): string {
  const hash = createHash('sha256')
    .update(realId + SESSION_SALT)
    .digest('hex')
    .substring(0, 12);
  return `${prefix}_${hash}`;
}

/**
 * Anonymize email address while preserving domain structure
 * john.doe@gmail.com -> patient_abc123@anonymized.cats
 */
export function anonymizeEmail(email: string): string {
  if (!email || !email.includes('@')) return '';

  const [localPart] = email.split('@');
  const hash = createHash('sha256')
    .update(localPart + SESSION_SALT)
    .digest('hex')
    .substring(0, 8);

  return `patient_${hash}@anonymized.cats`;
}

/**
 * Anonymize name while preserving structure
 * John Doe -> Patient_A1B2
 */
export function anonymizeName(name: string): string {
  if (!name) return 'Anonymous';

  const hash = createHash('sha256')
    .update(name + SESSION_SALT)
    .digest('hex')
    .substring(0, 4)
    .toUpperCase();

  return `Patient_${hash}`;
}

/**
 * Anonymize phone number
 * +1-555-123-4567 -> ***-***-**67
 */
export function anonymizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***-***-**${digits.slice(-2)}`;
}

/**
 * Generalize age to age range (k-anonymity)
 * 67 -> 65-70
 */
export function generalizeAge(age: number): string {
  if (age < 0 || age > 120) return 'Unknown';
  const lowerBound = Math.floor(age / 5) * 5;
  const upperBound = lowerBound + 5;
  return `${lowerBound}-${upperBound}`;
}

/**
 * Generalize date to month/year only
 * 2024-03-15 -> March 2024
 */
export function generalizeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Unknown';

  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Remove identifying information from free-text notes
 * Strips potential PHI patterns
 */
export function sanitizeNotes(notes: string): string {
  if (!notes) return '';

  let sanitized = notes;

  // Remove email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

  // Remove phone numbers
  sanitized = sanitized.replace(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE]');

  // Remove SSN patterns
  sanitized = sanitized.replace(/\d{3}[-\s]?\d{2}[-\s]?\d{4}/g, '[SSN]');

  // Remove common name patterns (Dr., Mr., Mrs., etc.)
  sanitized = sanitized.replace(/\b(Dr|Mr|Mrs|Ms|Miss)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, '[NAME]');

  // Remove addresses (simplified pattern)
  sanitized = sanitized.replace(/\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)/gi, '[ADDRESS]');

  // Remove ZIP codes
  sanitized = sanitized.replace(/\b\d{5}(-\d{4})?\b/g, '[ZIP]');

  return sanitized;
}

/**
 * Full profile anonymization for database storage
 */
export interface AnonymizedProfile {
  anonymousId: string;
  ageRange: string;
  gender: string | null;
  culturalBackground: string;
  conditions: string[];
  createdAt: string;
}

export function anonymizeProfile(profile: {
  id: string;
  name?: string;
  email?: string;
  age?: number;
  gender?: string;
  culturalBackground?: string;
  conditions?: string[];
  createdAt?: Date | string;
}): AnonymizedProfile {
  return {
    anonymousId: anonymizeId(profile.id),
    ageRange: profile.age ? generalizeAge(profile.age) : 'Unknown',
    gender: profile.gender || null,
    culturalBackground: profile.culturalBackground || 'not-specified',
    conditions: profile.conditions || [],
    createdAt: profile.createdAt ? generalizeDate(profile.createdAt) : generalizeDate(new Date()),
  };
}

/**
 * Anonymize session data for analytics
 */
export interface AnonymizedSession {
  sessionId: string;
  anonymousUserId: string;
  exerciseType: string;
  durationRange: string;
  formScoreRange: string;
  completedAt: string;
}

export function anonymizeSession(session: {
  id: string;
  userId: string;
  exerciseType?: string;
  durationSeconds?: number;
  formScore?: number;
  completedAt?: Date | string;
}): AnonymizedSession {
  // Generalize duration to ranges
  const getDurationRange = (seconds: number): string => {
    if (seconds < 300) return '0-5 min';
    if (seconds < 600) return '5-10 min';
    if (seconds < 900) return '10-15 min';
    if (seconds < 1200) return '15-20 min';
    return '20+ min';
  };

  // Generalize form score to ranges
  const getScoreRange = (score: number): string => {
    if (score < 50) return 'Needs Improvement';
    if (score < 70) return 'Fair';
    if (score < 85) return 'Good';
    if (score < 95) return 'Great';
    return 'Excellent';
  };

  return {
    sessionId: anonymizeId(session.id, 'session'),
    anonymousUserId: anonymizeId(session.userId),
    exerciseType: session.exerciseType || 'Unknown',
    durationRange: session.durationSeconds ? getDurationRange(session.durationSeconds) : 'Unknown',
    formScoreRange: session.formScore !== undefined ? getScoreRange(session.formScore) : 'Unknown',
    completedAt: session.completedAt ? generalizeDate(session.completedAt) : generalizeDate(new Date()),
  };
}

/**
 * Create a mapping table for de-anonymization (stored separately and securely)
 * This should ONLY be accessible by authorized personnel
 */
export interface IdentityMapping {
  anonymousId: string;
  realId: string;
  createdAt: Date;
  accessLog: { accessedBy: string; accessedAt: Date; reason: string }[];
}

export function createIdentityMapping(realId: string): IdentityMapping {
  return {
    anonymousId: anonymizeId(realId),
    realId,
    createdAt: new Date(),
    accessLog: [],
  };
}

/**
 * Audit log entry for PHI access
 */
export interface AuditLogEntry {
  timestamp: Date;
  action: 'view' | 'export' | 'modify' | 'delete';
  resourceType: 'profile' | 'session' | 'prescription' | 'message';
  resourceId: string;
  actorId: string;
  actorRole: 'patient' | 'doctor' | 'admin';
  ipAddress?: string;
  success: boolean;
  reason?: string;
}

export function createAuditLog(
  action: AuditLogEntry['action'],
  resourceType: AuditLogEntry['resourceType'],
  resourceId: string,
  actorId: string,
  actorRole: AuditLogEntry['actorRole'],
  success: boolean = true,
  reason?: string
): AuditLogEntry {
  return {
    timestamp: new Date(),
    action,
    resourceType,
    resourceId: anonymizeId(resourceId, resourceType),
    actorId: anonymizeId(actorId, actorRole),
    actorRole,
    success,
    reason,
  };
}

/**
 * Check if data needs to be anonymized based on context
 */
export function shouldAnonymize(context: 'storage' | 'analytics' | 'display' | 'export'): boolean {
  switch (context) {
    case 'storage':
      return true; // Always anonymize for storage
    case 'analytics':
      return true; // Always anonymize for analytics
    case 'display':
      return false; // Show real data to authenticated users
    case 'export':
      return true; // Anonymize when exporting data
    default:
      return true;
  }
}

export const dataAnonymization = {
  anonymizeId,
  anonymizeEmail,
  anonymizeName,
  anonymizePhone,
  generalizeAge,
  generalizeDate,
  sanitizeNotes,
  anonymizeProfile,
  anonymizeSession,
  createIdentityMapping,
  createAuditLog,
  shouldAnonymize,
};
