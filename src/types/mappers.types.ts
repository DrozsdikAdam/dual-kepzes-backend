import { Role, ApplicationStatus, PartnershipStatus } from '@prisma/client';

export interface MappedMajor {
     id: string;
     name: string;
     language: string;
}

export interface MappedLocation {
     id?: string;
     country: string;
     zipCode: string;
     city: string;
     address: string;
}

export interface MappedCompany {
     id: string;
     name: string;
     taxId?: string;
     description?: string | null;
     contactName?: string;
     contactEmail?: string;
     website?: string | null;
     logoUrl?: string | null;
     hasOwnApplication?: boolean;
     isActive?: boolean;
     createdAt?: Date;
     locations?: MappedLocation[];
     positions?: MappedPosition[];
}

export interface MappedPosition {
     id: string;
     companyId: string;
     title: string;
     description?: string | null;
     isDual: boolean;
     deadline?: Date | null;
     isActive: boolean;
     createdAt?: Date;
     company?: MappedCompany;
     locationId?: string | null;
     location?: MappedLocation | null;
     tags?: Array<{ name: string; category: string }>;
}

export interface MappedStudentProfile {
     id: string;
     userId: string;
     mothersName: string;
     birthDate: Date;
     highSchool: string;
     graduationYear: number;
     neptunCode?: string | null;
     major?: MappedMajor | null;
     currentMajor: string;
     studyMode: string;
     hasLanguageCert: boolean;
     isInHighSchool: boolean;
     firstChoice?: MappedMajor | null;
     secondChoice?: MappedMajor | null;
     language?: string | null;
     languageLevel?: string | null;
     location?: MappedLocation | null;
}

export interface MappedStudent {
     id: string;
     email: string;
     fullName: string;
     phoneNumber?: string;
     role: Role;
     isActive: boolean;
     isEmailVerified: boolean;
     studentProfile?: MappedStudentProfile | null;
}

export interface MappedApplication {
     id: string;
     studentId: string;
     positionId: string;
     status: ApplicationStatus;
     companyNote?: string | null;
     submittedAt: Date;
     student?: MappedStudent;
     position?: MappedPosition;
}

export interface MappedDualPartnership {
     id: string;
     studentId: string;
     mentorId?: string | null;
     uniEmployeeId?: string | null;
     positionId?: string | null;
     semester: string;
     contractNumber?: string | null;
     status: PartnershipStatus;
     startDate: Date;
     endDate?: Date | null;
     createdAt: Date;
     student?: MappedStudent;
     mentor?: {
          id: string;
          email: string;
          fullName: string;
          isEmailVerified: boolean;
          companyId: string;
          jobTitle?: string | null;
          company?: { name: string };
     };
     position?: {
          id: string;
          title: string;
          companyId: string;
          company: { name: string };
     };
     uniEmployee?: {
          id: string;
          email: string;
          fullName: string;
          isEmailVerified: boolean;
     };
}
