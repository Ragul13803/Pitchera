// /**
//  * useResumeExtraction.ts
//  *
//  * Custom hook that bridges extracted resume data with the existing
//  * React Hook Form profile form.
//  *
//  * Rules:
//  * 1. Never overwrites existing non-empty form values automatically
//  * 2. Only applies data when user explicitly clicks "Apply Extracted Information"
//  * 3. Empty extracted values never erase existing form values
//  * 4. Uses existing form methods: setValue(), useFieldArray()
//  * 5. Does not replace the existing form architecture
//  */

// import { ResumeExtractionResult } from '@/services/resume.service';
// import { useState, useCallback } from 'react';
// import { UseFormSetValue, UseFormGetValues } from 'react-hook-form';

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface UseResumeExtractionOptions {
//   /** React Hook Form setValue — from your existing useForm() instance */
//   setValue: UseFormSetValue<any>;
//   /** React Hook Form getValues — to check existing values */
//   getValues: UseFormGetValues<any>;
//   /**
//    * useFieldArray instances for list fields.
//    * Pass the appropriate replace() functions from your existing useFieldArray hooks.
//    */
//   fieldArrays?: {
//     replaceEducations?: (items: any[]) => void;
//     replaceExperiences?: (items: any[]) => void;
//     replaceProjects?: (items: any[]) => void;
//     replaceCertifications?: (items: any[]) => void;
//     replaceSkills?: (items: any[]) => void;
//   };
// }

// interface UseResumeExtractionReturn {
//   /** Extracted data waiting to be applied */
//   pendingExtraction: ResumeExtractionResult | null;
//   /** Warnings from the extraction */
//   extractionWarnings: string[];
//   /** Whether the preview modal should be shown */
//   showPreview: boolean;
//   /** Call this when extraction completes (from ResumeUploadButton callback) */
//   onExtractionComplete: (data: ResumeExtractionResult, warnings: string[]) => void;
//   /** Call this when user clicks "Apply Extracted Information" */
//   applyExtraction: () => void;
//   /** Call this when user clicks "Cancel" in preview */
//   cancelExtraction: () => void;
// }

// // ─── Hook ─────────────────────────────────────────────────────────────────────

// export function useResumeExtraction({
//   setValue,
//   getValues,
//   fieldArrays = {},
// }: UseResumeExtractionOptions): UseResumeExtractionReturn {
//   const [pendingExtraction, setPendingExtraction] =
//     useState<ResumeExtractionResult | null>(null);
//   const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);
//   const [showPreview, setShowPreview] = useState(false);

//   /**
//    * Triggered by ResumeUploadButton after successful extraction.
//    * Stores the extracted data and shows the preview modal.
//    * Does NOT apply anything to the form yet.
//    */
//   const onExtractionComplete = useCallback(
//     (data: ResumeExtractionResult, warnings: string[]) => {
//       setPendingExtraction(data);
//       setExtractionWarnings(warnings);
//       setShowPreview(true);
//     },
//     []
//   );

//   /**
//    * Applies extracted data to the form.
//    * Only sets fields where:
//    * 1. The extracted value is non-empty
//    * 2. The existing form value is empty/falsy (protection rule)
//    *
//    * Arrays (educations, experiences, etc.) are only replaced if extracted
//    * array is non-empty AND existing array is empty.
//    */
//   const applyExtraction = useCallback(() => {
//     if (!pendingExtraction) return;

//     const {
//       personal,
//       profile,
//       social_links,
//       skills,
//       educations,
//       experiences,
//       projects,
//       certifications,
//     } = pendingExtraction;

//     // ── Helper: set only if extracted value is non-empty ───────────────────
//     function safeSetValue(fieldPath: string, extractedValue: string | null | undefined) {
//       if (!extractedValue || String(extractedValue).trim() === '') return;
//       const currentValue = getValues(fieldPath);
//       if (!currentValue || String(currentValue).trim() === '') {
//         setValue(fieldPath, extractedValue, { shouldDirty: true, shouldValidate: false });
//       }
//     }

//     // ── Personal ──────────────────────────────────────────────────────────
//     if (personal) {
//       safeSetValue('first_name', personal.first_name);
//       safeSetValue('last_name', personal.last_name);
//       safeSetValue('email', personal.email);
//       safeSetValue('phone', personal.phone);
//       safeSetValue('location', personal.location);
//     }

//     // ── Profile ───────────────────────────────────────────────────────────
//     if (profile) {
//       safeSetValue('current_job_title', profile.current_job_title);
//       safeSetValue('current_company', profile.current_company);
//       safeSetValue('summary', profile.summary);
//       safeSetValue('notice_period', profile.notice_period);
//       safeSetValue('total_experience', profile.total_experience);
//       safeSetValue('relevant_experience', profile.relevant_experience);
//       safeSetValue('preferred_locations', profile.preferred_locations);
//       safeSetValue('employment_type', profile.employment_type);
//     }

//     // ── Social Links ──────────────────────────────────────────────────────
//     if (social_links) {
//       safeSetValue('linkedin', social_links.linkedin);
//       safeSetValue('github', social_links.github);
//       safeSetValue('portfolio', social_links.portfolio);
//     }

//     // ── Skills ────────────────────────────────────────────────────────────
//     if (skills && fieldArrays.replaceSkills) {
//       const currentSkills = getValues('skills') || [];
//       if (currentSkills.length === 0 && skills.technical.length > 0) {
//         const skillItems = skills.technical.map((name: string) => ({
//           name,
//           category: 'technical',
//         }));
//         fieldArrays.replaceSkills(skillItems);
//       }
//     } else if (skills && skills.technical.length > 0) {
//       // Fallback: set as comma-separated string if no fieldArray
//       const currentSkills = getValues('skills');
//       if (!currentSkills || currentSkills.length === 0) {
//         setValue('skills', skills.technical.join(', '), {
//           shouldDirty: true,
//           shouldValidate: false,
//         });
//       }
//     }

//     // ── Educations ────────────────────────────────────────────────────────
//     if (fieldArrays.replaceEducations && educations && educations.length > 0) {
//       const currentEducations = getValues('educations') || [];
//       if (currentEducations.length === 0) {
//         fieldArrays.replaceEducations(educations);
//       }
//     }

//     // ── Experiences ───────────────────────────────────────────────────────
//     if (fieldArrays.replaceExperiences && experiences && experiences.length > 0) {
//       const currentExperiences = getValues('experiences') || [];
//       if (currentExperiences.length === 0) {
//         fieldArrays.replaceExperiences(experiences);
//       }
//     }

//     // ── Projects ──────────────────────────────────────────────────────────
//     if (fieldArrays.replaceProjects && projects && projects.length > 0) {
//       const currentProjects = getValues('projects') || [];
//       if (currentProjects.length === 0) {
//         fieldArrays.replaceProjects(projects);
//       }
//     }

//     // ── Certifications ────────────────────────────────────────────────────
//     if (fieldArrays.replaceCertifications && certifications && certifications.length > 0) {
//       const currentCertifications = getValues('certifications') || [];
//       if (currentCertifications.length === 0) {
//         fieldArrays.replaceCertifications(certifications);
//       }
//     }

//     // ── Close preview ──────────────────────────────────────────────────────
//     setShowPreview(false);
//     setPendingExtraction(null);
//     setExtractionWarnings([]);
//   }, [pendingExtraction, setValue, getValues, fieldArrays]);

//   const cancelExtraction = useCallback(() => {
//     setShowPreview(false);
//     setPendingExtraction(null);
//     setExtractionWarnings([]);
//   }, []);

//   return {
//     pendingExtraction,
//     extractionWarnings,
//     showPreview,
//     onExtractionComplete,
//     applyExtraction,
//     cancelExtraction,
//   };
// }