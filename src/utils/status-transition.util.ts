/**
 * Status Transition Utility
 * ApplicationStatus és PartnershipStatus átmenetek validálása.
 */

import { ApplicationStatus, PartnershipStatus } from '@prisma/client';
import { BadRequestError } from '../errors/AppError';

/**
 * ApplicationStatus érvényes átmenetek
 * 
 * SUBMITTED -> ACCEPTED, REJECTED, NO_RESPONSE, RETRACTED
 * ACCEPTED -> (végleges, nincs további átmenet)
 * REJECTED -> (végleges, nincs további átmenet)
 * NO_RESPONSE -> ACCEPTED, REJECTED
 * RETRACTED -> (végleges, nincs további átmenet)
 */
const VALID_APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
     [ApplicationStatus.SUBMITTED]: [
          ApplicationStatus.ACCEPTED,
          ApplicationStatus.REJECTED,
          ApplicationStatus.NO_RESPONSE,
          ApplicationStatus.RETRACTED
     ],
     [ApplicationStatus.ACCEPTED]: [], // Végleges státusz
     [ApplicationStatus.REJECTED]: [], // Végleges státusz
     [ApplicationStatus.PENDING]: [
          ApplicationStatus.ACCEPTED,
          ApplicationStatus.REJECTED,
          ApplicationStatus.NO_RESPONSE
     ],
     [ApplicationStatus.NO_RESPONSE]: [
          ApplicationStatus.ACCEPTED,
          ApplicationStatus.REJECTED
     ],
     [ApplicationStatus.RETRACTED]: [] // Végleges státusz
};

/**
 * PartnershipStatus érvényes átmenetek
 * 
 * PENDING_MENTOR -> PENDING_UNIVERSITY, TERMINATED
 * PENDING_UNIVERSITY -> ACTIVE, TERMINATED
 * ACTIVE -> FINISHED, TERMINATED
 * FINISHED -> (végleges, nincs további átmenet)
 * TERMINATED -> (végleges, nincs további átmenet)
 */
const VALID_PARTNERSHIP_TRANSITIONS: Record<PartnershipStatus, PartnershipStatus[]> = {
     [PartnershipStatus.PENDING_MENTOR]: [
          PartnershipStatus.PENDING_UNIVERSITY,
          PartnershipStatus.TERMINATED
     ],
     [PartnershipStatus.PENDING_UNIVERSITY]: [
          PartnershipStatus.ACTIVE,
          PartnershipStatus.TERMINATED
     ],
     [PartnershipStatus.ACTIVE]: [
          PartnershipStatus.FINISHED,
          PartnershipStatus.TERMINATED
     ],
     [PartnershipStatus.FINISHED]: [], // Végleges státusz
     [PartnershipStatus.TERMINATED]: [] // Végleges státusz
};

/**
 * Ellenőrzi, hogy az ApplicationStatus átmenet érvényes-e
 * @param currentStatus Jelenlegi státusz
 * @param nextStatus Új státusz
 * @returns true, ha az átmenet érvényes
 */
export function isValidApplicationTransition(
     currentStatus: ApplicationStatus,
     nextStatus: ApplicationStatus
): boolean {
     const allowed = VALID_APPLICATION_TRANSITIONS[currentStatus];
     return allowed.includes(nextStatus);
}

/**
 * Ellenőrzi, hogy a PartnershipStatus átmenet érvényes-e
 * @param currentStatus Jelenlegi státusz
 * @param nextStatus Új státusz
 * @returns true, ha az átmenet érvényes
 */
export function isValidPartnershipTransition(
     currentStatus: PartnershipStatus,
     nextStatus: PartnershipStatus
): boolean {
     const allowed = VALID_PARTNERSHIP_TRANSITIONS[currentStatus];
     return allowed.includes(nextStatus);
}

/**
 * Validálja és dob hibát, ha az ApplicationStatus átmenet érvénytelen
 * @param currentStatus Jelenlegi státusz
 * @param nextStatus Új státusz
 * @throws BadRequestError ha az átmenet érvénytelen
 */
export function validateApplicationTransition(
     currentStatus: ApplicationStatus,
     nextStatus: ApplicationStatus
): void {
     if (!isValidApplicationTransition(currentStatus, nextStatus)) {
          throw new BadRequestError(
               `Érvénytelen státusz átmenet: ${currentStatus} → ${nextStatus}. ` +
               `Engedélyezett átmenetek: ${VALID_APPLICATION_TRANSITIONS[currentStatus].join(', ') || 'nincs (végleges státusz)'}`
          );
     }
}

/**
 * Validálja és dob hibát, ha a PartnershipStatus átmenet érvénytelen
 * @param currentStatus Jelenlegi státusz
 * @param nextStatus Új státusz
 * @throws BadRequestError ha az átmenet érvénytelen
 */
export function validatePartnershipTransition(
     currentStatus: PartnershipStatus,
     nextStatus: PartnershipStatus
): void {
     if (!isValidPartnershipTransition(currentStatus, nextStatus)) {
          throw new BadRequestError(
               `Érvénytelen státusz átmenet: ${currentStatus} → ${nextStatus}. ` +
               `Engedélyezett átmenetek: ${VALID_PARTNERSHIP_TRANSITIONS[currentStatus].join(', ') || 'nincs (végleges státusz)'}`
          );
     }
}
