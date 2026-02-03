/**
 * Utility functions for semester calculation.
 * 
 * Semester format: "YYYY/YY/X" where:
 * - YYYY/YY is the academic year (e.g., 2025/26)
 * - X is 1 for fall semester (September-January) or 2 for spring semester (February-June)
 * 
 * Academic year starts in September.
 */

/**
 * Gets the current semester based on the provided date.
 * Fall semester: September 1 - January 31
 * Spring semester: February 1 - August 31 (with next academic year starting in September)
 * 
 * @param date - The date to calculate semester for (defaults to current date)
 * @returns Semester string in format "YYYY/YY/X"
 */
export function getCurrentSemester(date: Date = new Date()): string {
     const month = date.getMonth(); // 0-11
     const year = date.getFullYear();

     // September (8) to January (0) = Fall semester (1)
     // February (1) to August (7) = Spring semester (2)
     const isFallSemester = month >= 8 || month === 0;
     const semesterNumber = isFallSemester ? 1 : 2;

     let academicStartYear: number;
     if (month >= 8) {
          // September-December: current year starts the academic year
          academicStartYear = year;
     } else if (month === 0) {
          // January: still fall semester of previous academic year
          academicStartYear = year - 1;
     } else {
          // February-August: spring semester of academic year that started previous September
          academicStartYear = year - 1;
     }

     const academicEndYear = academicStartYear + 1;
     const shortEndYear = String(academicEndYear).slice(-2);

     return `${academicStartYear}/${shortEndYear}/${semesterNumber}`;
}
