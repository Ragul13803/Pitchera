import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  useForm,
  useFieldArray,
  Controller,
  type Path,
  type PathValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  toEducationLevel,
  type ExtractionResult,
  type ExtractedResumeData,
  type ResumeExtractionMetadata,
} from "@/types/resume";
import { ResumeUploader } from "@/components/ResumeUploader";
import { ResumeExtractionPreview } from "@/components/ResumeExtractionPreview";

// ================================
// Zod Validation Schema
// ================================

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  location: z.string().optional(),

  current_job_title: z.string().optional(),
  current_company: z.string().optional(),
  total_experience: z.string().optional(),
  relevant_experience: z.string().optional(),
  notice_period: z.string().optional(),
  current_salary: z.string().optional(),
  expected_salary: z.string().optional(),
  preferred_locations: z.string().optional(),
  employment_type: z.string().optional(),
  summary: z.string().optional(),

  linkedin: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),

  technical_skills: z.array(z.string()).optional(),
  soft_skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),

  experiences: z
    .array(
      z.object({
        company: z.string(),
        designation: z.string(),
        start_date: z.string().nullable(),
        end_date: z.string().nullable(),
        currently_working: z.boolean(),
        description: z.string(),
        technologies: z.string(),
      })
    )
    .optional(),

  educations: z
    .array(
      z.object({
        level: z.enum(["10th", "12th", "diploma", "bachelor", "master", "other"]),
        institution: z.string(),
        degree: z.string(),
        field_of_study: z.string(),
        start_date: z.string().nullable(),
        end_date: z.string().nullable(),
        grade: z.string(),
      })
    )
    .optional(),

  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        technologies: z.string(),
        project_url: z.string(),
        github_url: z.string(),
      })
    )
    .optional(),

  certifications: z
    .array(
      z.object({
        name: z.string(),
        organization: z.string(),
        issue_date: z.string().nullable(),
        credential_url: z.string(),
      })
    )
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// ================================
// Profile Screen
// ================================

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] =
    useState<ExtractedResumeData | null>(null);
  const [extractionMetadata, setExtractionMetadata] =
    useState<ResumeExtractionMetadata | null>(null);
  const [showReview, setShowReview] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      location: "",
      current_job_title: "",
      current_company: "",
      total_experience: "",
      relevant_experience: "",
      notice_period: "",
      current_salary: "",
      expected_salary: "",
      preferred_locations: "",
      employment_type: "",
      summary: "",
      linkedin: "",
      github: "",
      portfolio: "",
      technical_skills: [],
      soft_skills: [],
      languages: [],
      experiences: [],
      educations: [],
      projects: [],
      certifications: [],
    },
  });

  // ── Field Arrays ────────────────────────────────────────────────────────────

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
    replace: replaceExperiences,
  } = useFieldArray({ control, name: "experiences" });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
    replace: replaceEducations,
  } = useFieldArray({ control, name: "educations" });

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
    replace: replaceProjects,
  } = useFieldArray({ control, name: "projects" });

  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertification,
    replace: replaceCertifications,
  } = useFieldArray({ control, name: "certifications" });

  // ================================
  // Resume Extraction
  // ================================

  const handleExtractionComplete = (result: ExtractionResult) => {
    if (result.cancelled) return;

    if (result.success && result.data && result.metadata) {
      setExtractedData(result.data);
      setExtractionMetadata(result.metadata);
      setShowReview(true);
    } else if (result.error) {
      Alert.alert("Extraction Failed", result.error);
    }
  };

  /**
   * Sets a form field ONLY when the extracted value is non-empty
   * AND the current form value is empty.
   * Existing profile data is never overwritten.
   */
  function safeSet<K extends Path<ProfileFormData>>(
    field: K,
    value: string | null | undefined
  ) {
    if (!value || value.trim() === "") return;

    const current = getValues(field);
    const isEmpty =
      current === undefined ||
      current === null ||
      (typeof current === "string" && current.trim() === "");

    if (isEmpty) {
      setValue(field, value as PathValue<ProfileFormData, K>, {
        shouldDirty: true,
      });
    }
  }

  const handleApplyExtractedData = () => {
    if (!extractedData) return;

    const { personal, profile, social_links, skills } = extractedData;

    // ── Personal ──────────────────────────────────────────────────────────────
    safeSet("first_name", personal.first_name);
    safeSet("last_name", personal.last_name);
    safeSet("email", personal.email);
    safeSet("phone", personal.phone);
    safeSet("location", personal.location);

    // ── Profile ───────────────────────────────────────────────────────────────
    safeSet("current_job_title", profile.current_job_title);
    safeSet("current_company", profile.current_company);
    safeSet("total_experience", profile.total_experience);
    safeSet("relevant_experience", profile.relevant_experience);
    safeSet("notice_period", profile.notice_period);
    safeSet("current_salary", profile.current_salary);
    safeSet("expected_salary", profile.expected_salary);
    safeSet("preferred_locations", profile.preferred_locations);
    safeSet("employment_type", profile.employment_type);
    safeSet("summary", profile.summary);

    // ── Social Links ──────────────────────────────────────────────────────────
    safeSet("linkedin", social_links.linkedin);
    safeSet("github", social_links.github);
    safeSet("portfolio", social_links.portfolio);

    // ── Skills (only when current list is empty) ─────────────────────────────
    if ((getValues("technical_skills") ?? []).length === 0 && skills.technical.length > 0) {
      setValue("technical_skills", skills.technical, { shouldDirty: true });
    }
    if ((getValues("soft_skills") ?? []).length === 0 && skills.soft.length > 0) {
      setValue("soft_skills", skills.soft, { shouldDirty: true });
    }
    if ((getValues("languages") ?? []).length === 0 && skills.language.length > 0) {
      setValue("languages", skills.language, { shouldDirty: true });
    }

    // ── Experiences ───────────────────────────────────────────────────────────
    if ((getValues("experiences") ?? []).length === 0 && extractedData.experiences.length > 0) {
      replaceExperiences(extractedData.experiences);
    }

    // ── Educations (level must be coerced to the schema enum) ────────────────
    if ((getValues("educations") ?? []).length === 0 && extractedData.educations.length > 0) {
      replaceEducations(
        extractedData.educations.map((edu) => ({
          level: toEducationLevel(edu.level),
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.field_of_study,
          start_date: edu.start_date,
          end_date: edu.end_date,
          grade: edu.grade,
        }))
      );
    }

    // ── Projects ──────────────────────────────────────────────────────────────
    if ((getValues("projects") ?? []).length === 0 && extractedData.projects.length > 0) {
      replaceProjects(extractedData.projects);
    }

    // ── Certifications ────────────────────────────────────────────────────────
    if ((getValues("certifications") ?? []).length === 0 && extractedData.certifications.length > 0) {
      replaceCertifications(extractedData.certifications);
    }

    setShowReview(false);
    setExtractedData(null);
    setExtractionMetadata(null);

    Alert.alert(
      "Applied",
      "Resume information applied. Please review and press Save Profile."
    );
  };

  const handleCancelReview = () => {
    setShowReview(false);
    setExtractedData(null);
    setExtractionMetadata(null);
  };

  // ================================
  // Save (existing profile API)
  // ================================

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true);
      console.log("Saving profile:", data);

      // Use your existing profile API here — do not create a second save path

      Alert.alert("Success", "Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // Render
  // ================================

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>My Profile</Text>

      {/* Resume Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Fill from Resume</Text>
        <ResumeUploader onExtractionComplete={handleExtractionComplete} />
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <Controller
          control={control}
          name="first_name"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                value={value}
                onChangeText={onChange}
              />
              {errors.first_name && (
                <Text style={styles.errorText}>{errors.first_name.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="last_name"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                value={value}
                onChangeText={onChange}
              />
              {errors.last_name && (
                <Text style={styles.errorText}>{errors.last_name.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="location"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="City, State"
                value={value}
                onChangeText={onChange}
              />
            </View>
          )}
        />
      </View>

      {/* Professional Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Information</Text>

        <Controller
          control={control}
          name="current_job_title"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Job Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Frontend Developer"
                value={value}
                onChangeText={onChange}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="current_company"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Company</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., ABC Technologies"
                value={value}
                onChangeText={onChange}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="total_experience"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Total Experience</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 5 years"
                value={value}
                onChangeText={onChange}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="notice_period"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Notice Period</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 30 days"
                value={value}
                onChangeText={onChange}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="summary"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Professional Summary</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief summary about yourself"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        />
      </View>

      {/* Social Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Links</Text>

        <Controller
          control={control}
          name="linkedin"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>LinkedIn</Text>
              <TextInput
                style={styles.input}
                placeholder="https://linkedin.com/in/yourprofile"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="github"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>GitHub</Text>
              <TextInput
                style={styles.input}
                placeholder="https://github.com/yourprofile"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="portfolio"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Portfolio</Text>
              <TextInput
                style={styles.input}
                placeholder="https://yourportfolio.com"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
              />
            </View>
          )}
        />
      </View>

      {/* Experience */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              appendExperience({
                company: "",
                designation: "",
                start_date: null,
                end_date: null,
                currently_working: false,
                description: "",
                technologies: "",
              })
            }
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {experienceFields.map((field, index) => (
          <View key={field.id} style={styles.arrayItem}>
            <View style={styles.arrayItemHeader}>
              <Text style={styles.arrayItemTitle}>Experience {index + 1}</Text>
              <TouchableOpacity onPress={() => removeExperience(index)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name={`experiences.${index}.company`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Company</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Company name"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name={`experiences.${index}.designation`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Designation</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Job title"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name={`experiences.${index}.start_date`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Start Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM"
                    value={value ?? ""}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name={`experiences.${index}.end_date`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>End Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM (blank if current)"
                    value={value ?? ""}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name={`experiences.${index}.description`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Job description"
                    value={value}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name={`experiences.${index}.technologies`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Technologies</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="React, Node.js, MySQL"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
          </View>
        ))}
      </View>

      {/* Education */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Education</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              appendEducation({
                level: "bachelor",
                institution: "",
                degree: "",
                field_of_study: "",
                start_date: null,
                end_date: null,
                grade: "",
              })
            }
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {educationFields.map((field, index) => (
          <View key={field.id} style={styles.arrayItem}>
            <View style={styles.arrayItemHeader}>
              <Text style={styles.arrayItemTitle}>Education {index + 1}</Text>
              <TouchableOpacity onPress={() => removeEducation(index)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name={`educations.${index}.institution`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Institution</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="University/College name"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name={`educations.${index}.degree`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Degree</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., BCA, B.Tech"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name={`educations.${index}.field_of_study`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Field of Study</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Computer Science"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name={`educations.${index}.grade`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Grade</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 8.2 CGPA, 57%"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
          </View>
        ))}
      </View>

      {/* Projects */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Projects</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              appendProject({
                name: "",
                description: "",
                technologies: "",
                project_url: "",
                github_url: "",
              })
            }
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {projectFields.map((field, index) => (
          <View key={field.id} style={styles.arrayItem}>
            <View style={styles.arrayItemHeader}>
              <Text style={styles.arrayItemTitle}>Project {index + 1}</Text>
              <TouchableOpacity onPress={() => removeProject(index)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name={`projects.${index}.name`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Project Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Project name"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name={`projects.${index}.description`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Project description"
                    value={value}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name={`projects.${index}.technologies`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Technologies</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="React, Node.js"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
          </View>
        ))}
      </View>

      {/* Certifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              appendCertification({
                name: "",
                organization: "",
                issue_date: null,
                credential_url: "",
              })
            }
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {certificationFields.map((field, index) => (
          <View key={field.id} style={styles.arrayItem}>
            <View style={styles.arrayItemHeader}>
              <Text style={styles.arrayItemTitle}>
                Certification {index + 1}
              </Text>
              <TouchableOpacity onPress={() => removeCertification(index)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name={`certifications.${index}.name`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Certification name"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name={`certifications.${index}.organization`}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Organization</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Issuing organization"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
          </View>
        ))}
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile</Text>
        )}
      </TouchableOpacity>

      {/* Review Modal */}
      <ResumeExtractionPreview
        visible={showReview}
        extractedData={extractedData}
        metadata={extractionMetadata}
        onApply={handleApplyExtractedData}
        onCancel={handleCancelReview}
      />
    </ScrollView>
  );
}

// ================================
// Styles
// ================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 24, color: "#111" },
  section: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#111" },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
  addButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  inputContainer: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  errorText: { color: "#ff3b30", fontSize: 12, marginTop: 4 },
  arrayItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  arrayItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  arrayItemTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  removeText: { color: "#ff3b30", fontSize: 14, fontWeight: "600" },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});