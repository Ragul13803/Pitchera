// src/app/(app)/profile.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "../../context/ThemeContext";
import { useLogout } from "@/hooks/useLogout";
import PopupModal from "@/components/PopupModal";
import { Loading } from "@/components/ui/Loading";
import { api } from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PitcheraUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
}

interface ProfileData {
  phone?: string;
  location?: string;
  profile_photo_url?: string;
  current_job_title?: string;
  current_company?: string;
  total_experience?: string;
  relevant_experience?: string;
  notice_period?: string;
  current_salary?: string;
  expected_salary?: string;
  preferred_locations?: string;
  employment_type?: string;
  summary?: string;
}

interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

interface Skill {
  id?: number;
  type: "technical" | "soft" | "language";
  name: string;
}

interface Education {
  id?: number;
  level: "10th" | "12th" | "diploma" | "bachelor" | "master" | "other";
  institution: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  grade?: string;
}

interface Experience {
  id?: number;
  company: string;
  designation: string;
  start_date: string;
  end_date?: string;
  currently_working: boolean;
  description?: string;
  technologies?: string;
}

interface Project {
  id?: number;
  name: string;
  description?: string;
  technologies?: string;
  project_url?: string;
  github_url?: string;
}

interface Certification {
  id?: number;
  name: string;
  organization: string;
  issue_date?: string;
  credential_url?: string;
}

interface Resume {
  id: number;
  original_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface ProfileCompletion {
  percentage: number;
  missing_sections: string[];
}

// ─── Section IDs ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "account",        label: "Account",        icon: "person-outline"         },
  { id: "professional",   label: "Professional",   icon: "briefcase-outline"      },
  { id: "social",         label: "Social",         icon: "share-social-outline"   },
  { id: "skills",         label: "Skills",         icon: "code-slash-outline"     },
  { id: "education",      label: "Education",      icon: "school-outline"         },
  { id: "experience",     label: "Experience",     icon: "business-outline"       },
  { id: "projects",       label: "Projects",       icon: "folder-open-outline"    },
  { id: "certifications", label: "Certifications", icon: "ribbon-outline"         },
  { id: "resume",         label: "Resume",         icon: "document-text-outline"  },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

const EDUCATION_LEVELS = ["10th", "12th", "diploma", "bachelor", "master", "other"] as const;
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];

// ─── Reusable Field Components ───────────────────────────────────────────────

function FieldLabel({ text, required, colors }: { text: string; required?: boolean; colors: any }) {
  return (
    <Text style={[fs.label, { color: colors.textSecondary }]}>
      {text}
      {required && <Text style={{ color: "#EF4444" }}> *</Text>}
    </Text>
  );
}

function StyledInput({
  label, value, onChangeText, placeholder, multiline, keyboardType,
  autoCapitalize, required, colors, editable = true,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: any;
  autoCapitalize?: any; required?: boolean; colors: any; editable?: boolean;
}) {
  return (
    <View style={fs.group}>
      <FieldLabel text={label} required={required} colors={colors} />
      <TextInput
        style={[
          multiline ? fs.textarea : fs.input,
          {
            backgroundColor: editable ? colors.card : colors.background,
            borderColor: colors.border,
            color: editable ? colors.text : colors.textSecondary,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : undefined}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
        editable={editable}
      />
    </View>
  );
}

const fs = StyleSheet.create({
  group:    { marginBottom: 14 },
  label:    { fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input:    { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, minHeight: 90 },
});

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function SectionCard({
  title, icon, children, colors, onSave, saving, accent,
}: {
  title: string; icon: string; children: React.ReactNode;
  colors: any; onSave?: () => void; saving?: boolean; accent?: string;
}) {
  return (
    <View style={[sw.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={sw.head}>
        <View style={[sw.iconWrap, { backgroundColor: (accent ?? colors.primary) + "15" }]}>
          <Ionicons name={icon as any} size={18} color={accent ?? colors.primary} />
        </View>
        <Text style={[sw.title, { color: colors.text }]}>{title}</Text>
        {onSave && (
          <TouchableOpacity
            style={[sw.saveBtn, { backgroundColor: accent ?? colors.primary }]}
            onPress={onSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="checkmark-outline" size={14} color="#fff" /><Text style={sw.saveTxt}>Save</Text></>
            }
          </TouchableOpacity>
        )}
      </View>
      <View style={[sw.divider, { backgroundColor: colors.border }]} />
      <View style={sw.body}>{children}</View>
    </View>
  );
}

const sw = StyleSheet.create({
  card:    { borderWidth: 1, borderRadius: 16, marginBottom: 16, overflow: "hidden", ...Platform.select({ ios: { shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 }, android: { elevation: 2 }, web: { boxShadow:"0 2px 8px rgba(0,0,0,0.06)" } as any }) },
  head:    { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, paddingBottom: 14 },
  iconWrap:{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title:   { flex: 1, fontSize: 15, fontWeight: "800" },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  saveTxt: { color: "#fff", fontSize: 13, fontWeight: "700" },
  divider: { height: 1 },
  body:    { padding: 16 },
});

// ─── Tab Pill ─────────────────────────────────────────────────────────────────

function TabPill({ sec, active, missing, colors, onPress }: {
  sec: typeof SECTIONS[number]; active: boolean; missing: boolean; colors: any; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        tp.pill,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : missing ? "#F59E0B" : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={sec.icon as any}
        size={13}
        color={active ? "#fff" : missing ? "#F59E0B" : colors.textSecondary}
      />
      <Text style={[tp.text, { color: active ? "#fff" : missing ? "#F59E0B" : colors.textSecondary }]}>
        {sec.label}
      </Text>
      {missing && !active && <View style={tp.dot} />}
    </TouchableOpacity>
  );
}

const tp = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, position: "relative" },
  text: { fontSize: 12, fontWeight: "600" },
  dot:  { position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: "#F59E0B", borderWidth: 1.5, borderColor: "#fff" },
});

// ─── Progress Arc ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, colors }: { pct: number; colors: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 900, useNativeDriver: false }).start();
  }, [pct]);

  const barColor = pct < 40 ? "#EF4444" : pct < 70 ? "#F59E0B" : pct < 90 ? "#3B82F6" : "#10B981";
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <View style={pb.wrap}>
      <View style={pb.row}>
        <Text style={[pb.label, { color: colors.text }]}>Profile Strength</Text>
        <Text style={[pb.pct, { color: barColor }]}>{pct}%</Text>
      </View>
      <View style={[pb.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[pb.fill, { width, backgroundColor: barColor }]} />
      </View>
      <Text style={[pb.hint, { color: colors.textSecondary }]}>
        {pct < 40 ? "Add more sections to improve your profile" :
         pct < 70 ? "Good progress! Keep adding details" :
         pct < 90 ? "Almost there! A few more sections left" :
         "Excellent! Your profile is fully complete 🎉"}
      </Text>
    </View>
  );
}

const pb = StyleSheet.create({
  wrap:  { marginBottom: 6 },
  row:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "700" },
  pct:   { fontSize: 18, fontWeight: "900" },
  track: { height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 8 },
  fill:  { height: "100%", borderRadius: 5 },
  hint:  { fontSize: 12 },
});

// ─── Entry Card (Education / Experience / Project / Certification) ────────────

function EntryCard({
  index, onRemove, children, colors,
}: {
  index: number; onRemove: () => void; children: React.ReactNode; colors: any;
}) {
  return (
    <View style={[ec.wrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={ec.head}>
        <View style={[ec.num, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[ec.numText, { color: colors.primary }]}>{index + 1}</Text>
        </View>
        <TouchableOpacity style={ec.removeBtn} onPress={onRemove}>
          <Ionicons name="trash-outline" size={15} color="#DC2626" />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

const ec = StyleSheet.create({
  wrap:     { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  head:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  num:      { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  numText:  { fontSize: 12, fontWeight: "800" },
  removeBtn:{ padding: 6, backgroundColor: "#FEE2E2", borderRadius: 8 },
});

// ─── Add Button ───────────────────────────────────────────────────────────────

function AddBtn({ label, onPress, colors }: { label: string; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      style={[ab.btn, { borderColor: colors.primary }]}
      onPress={onPress}
    >
      <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
      <Text style={[ab.text, { color: colors.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const ab = StyleSheet.create({
  btn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1.5, borderStyle: "dashed", borderRadius: 10, paddingVertical: 12, marginTop: 4 },
  text: { fontSize: 14, fontWeight: "700" },
});

// ─── Skill Tag ────────────────────────────────────────────────────────────────

function SkillTag({ name, onRemove, colors }: { name: string; onRemove: () => void; colors: any }) {
  return (
    <View style={[st.tag, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
      <Text style={[st.text, { color: colors.primary }]}>{name}</Text>
      <TouchableOpacity onPress={onRemove}>
        <Ionicons name="close-circle" size={15} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  tag:  { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: 12, fontWeight: "600" },
});

// ─── Select Buttons ───────────────────────────────────────────────────────────

function SelectOptions({ options, selected, onSelect, colors }: {
  options: string[]; selected: string; onSelect: (v: string) => void; colors: any;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[
            so.opt,
            {
              backgroundColor: selected === opt ? colors.primary : colors.background,
              borderColor: selected === opt ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[so.optText, { color: selected === opt ? "#fff" : colors.text }]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const so = StyleSheet.create({
  opt:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  optText: { fontSize: 13, fontWeight: "600" },
});

// ─── Resume Extraction Modal ──────────────────────────────────────────────────

interface ExtractedData {
  profile?: Partial<ProfileData>;
  social?: Partial<SocialLinks>;
  skills?: { technical: string[]; soft: string[]; languages: string[] };
  education?: Partial<Education>[];
  experience?: Partial<Experience>[];
  projects?: Partial<Project>[];
  certifications?: Partial<Certification>[];
}

function ExtractionModal({
  visible, data, onAccept, onClose, colors,
}: {
  visible: boolean;
  data: ExtractedData | null;
  onAccept: (d: ExtractedData) => void;
  onClose: () => void;
  colors: any;
}) {
  if (!data) return null;

  const fields: { label: string; value: string }[] = [];
  if (data.profile?.current_job_title) fields.push({ label: "Job Title", value: data.profile.current_job_title });
  if (data.profile?.current_company)   fields.push({ label: "Company",   value: data.profile.current_company });
  if (data.profile?.total_experience)  fields.push({ label: "Experience", value: data.profile.total_experience });
  if (data.profile?.summary)           fields.push({ label: "Summary",   value: data.profile.summary });
  if (data.social?.linkedin)           fields.push({ label: "LinkedIn",  value: data.social.linkedin });
  if (data.social?.github)             fields.push({ label: "GitHub",    value: data.social.github });
  if (data.skills?.technical?.length)  fields.push({ label: "Technical Skills", value: data.skills.technical.join(", ") });
  if (data.education?.length)          fields.push({ label: "Education entries", value: `${data.education.length} found` });
  if (data.experience?.length)         fields.push({ label: "Experience entries", value: `${data.experience.length} found` });
  if (data.projects?.length)           fields.push({ label: "Projects", value: `${data.projects.length} found` });
  if (data.certifications?.length)     fields.push({ label: "Certifications", value: `${data.certifications.length} found` });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[em2.container, { backgroundColor: colors.background }]}>
        <View style={[em2.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={em2.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={em2.headerCenter}>
            <Text style={[em2.title, { color: colors.text }]}>Resume Extracted</Text>
            <Text style={[em2.subtitle, { color: colors.textSecondary }]}>Review and apply to your profile</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={[em2.successBanner, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
            <Ionicons name="checkmark-circle" size={22} color="#059669" />
            <Text style={em2.successText}>Successfully extracted data from your resume</Text>
          </View>

          <Text style={[em2.sectionLabel, { color: colors.textSecondary }]}>EXTRACTED INFORMATION</Text>

          {fields.map((f, i) => (
            <View key={i} style={[em2.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[em2.fieldLabel, { color: colors.textSecondary }]}>{f.label}</Text>
              <Text style={[em2.fieldValue, { color: colors.text }]}>{f.value}</Text>
            </View>
          ))}

          {fields.length === 0 && (
            <View style={em2.empty}>
              <Ionicons name="document-outline" size={40} color={colors.textSecondary} />
              <Text style={[em2.emptyText, { color: colors.textSecondary }]}>No data could be extracted</Text>
            </View>
          )}

          <View style={em2.actions}>
            <TouchableOpacity
              style={[em2.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[em2.cancelText, { color: colors.textSecondary }]}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[em2.acceptBtn, { backgroundColor: colors.primary }]}
              onPress={() => onAccept(data)}
            >
              <Ionicons name="checkmark-outline" size={16} color="#fff" />
              <Text style={em2.acceptText}>Apply to Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const em2 = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 56 : 16, paddingBottom: 14, borderBottomWidth: 1 },
  closeBtn:     { width: 32 },
  headerCenter: { flex: 1, alignItems: "center" },
  title:        { fontSize: 17, fontWeight: "800" },
  subtitle:     { fontSize: 12, marginTop: 2 },
  successBanner:{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20 },
  successText:  { fontSize: 14, color: "#065F46", fontWeight: "600", flex: 1 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  field:        { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  fieldLabel:   { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  fieldValue:   { fontSize: 14, lineHeight: 20 },
  empty:        { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText:    { fontSize: 14 },
  actions:      { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn:    { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  cancelText:   { fontSize: 14, fontWeight: "700" },
  acceptBtn:    { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14 },
  acceptText:   { color: "#fff", fontSize: 14, fontWeight: "700" },
});

// ─── MAIN PROFILE SCREEN ──────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors }  = useTheme();
  const { logout }  = useLogout();

  // ── Existing state (unchanged) ─────────────────────────────────────────────
  const [user, setUser]           = useState<PitcheraUser | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  // ── New state ──────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<SectionId>("account");
  const tabScrollRef = useRef<ScrollView>(null);

  // Profile data
  const [profileData, setProfileData]       = useState<ProfileData>({});
  const [socialLinks, setSocialLinks]       = useState<SocialLinks>({});
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [softSkills, setSoftSkills]         = useState<string[]>([]);
  const [languages, setLanguages]           = useState<string[]>([]);
  const [educations, setEducations]         = useState<Education[]>([]);
  const [experiences, setExperiences]       = useState<Experience[]>([]);
  const [projects, setProjects]             = useState<Project[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [resume, setResume]                 = useState<Resume | null>(null);
  const [completion, setCompletion]         = useState<ProfileCompletion>({ percentage: 0, missing_sections: [] });

  // Saving states per section
  const [savingProfile, setSavingProfile]     = useState(false);
  const [savingSocial, setSavingSocial]       = useState(false);
  const [savingSkills, setSavingSkills]       = useState(false);
  const [savingEdu, setSavingEdu]             = useState(false);
  const [savingExp, setSavingExp]             = useState(false);
  const [savingProj, setSavingProj]           = useState(false);
  const [savingCerts, setSavingCerts]         = useState(false);

  // Resume
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume]   = useState(false);

  // Skill inputs
  const [techInput, setTechInput]   = useState("");
  const [softInput, setSoftInput]   = useState("");
  const [langInput, setLangInput]   = useState("");

  // Extraction
  const [extractedData, setExtractedData]     = useState<ExtractedData | null>(null);
  const [showExtraction, setShowExtraction]   = useState(false);

  // ── Load everything ────────────────────────────────────────────────────────

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("pitchera_user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Failed to load pitchera_user:", e);
    }
  };

  const loadProfileData = useCallback(async () => {
    try {
      const [profileRes, socialRes, skillsRes, eduRes, expRes, projRes, certRes, resumeRes, completionRes] =
        await Promise.allSettled([
          api.get("/profile"),
          api.get("/profile/social-links"),
          api.get("/profile/skills"),
          api.get("/profile/educations"),
          api.get("/profile/experiences"),
          api.get("/profile/projects"),
          api.get("/profile/certifications"),
          api.get("/profile/resume"),
          api.get("/profile/completion"),
        ]);

      if (profileRes.status    === "fulfilled") setProfileData(profileRes.value?.data ?? profileRes.value ?? {});
      if (socialRes.status     === "fulfilled") setSocialLinks(socialRes.value?.data ?? socialRes.value ?? {});
      if (skillsRes.status     === "fulfilled") {
        const s = skillsRes.value?.data ?? skillsRes.value ?? [];
        if (Array.isArray(s)) {
          setTechnicalSkills(s.filter((x: Skill) => x.type === "technical").map((x: Skill) => x.name));
          setSoftSkills(s.filter((x: Skill) => x.type === "soft").map((x: Skill) => x.name));
          setLanguages(s.filter((x: Skill) => x.type === "language").map((x: Skill) => x.name));
        }
      }
      if (eduRes.status        === "fulfilled") setEducations(eduRes.value?.data ?? eduRes.value ?? []);
      if (expRes.status        === "fulfilled") setExperiences(expRes.value?.data ?? expRes.value ?? []);
      if (projRes.status       === "fulfilled") setProjects(projRes.value?.data ?? projRes.value ?? []);
      if (certRes.status       === "fulfilled") setCertifications(certRes.value?.data ?? certRes.value ?? []);
      if (resumeRes.status     === "fulfilled") setResume(resumeRes.value?.data ?? resumeRes.value ?? null);
      if (completionRes.status === "fulfilled") setCompletion(completionRes.value?.data ?? completionRes.value ?? { percentage: 0, missing_sections: [] });
    } catch (e) {
      console.error("loadProfileData error:", e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadUser();
      await loadProfileData();
      setLoading(false);
    };
    init();
  }, [loadProfileData]);

  const refreshCompletion = async () => {
    try {
      const res = await api.get("/profile/completion");
      setCompletion(res?.data ?? res ?? { percentage: 0, missing_sections: [] });
    } catch {}
  };

  // ── Save Handlers ──────────────────────────────────────────────────────────

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put("/profile", profileData);
      await refreshCompletion();
      Alert.alert("Saved ✓", "Professional details updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save.");
    } finally { setSavingProfile(false); }
  };

  const saveSocial = async () => {
    setSavingSocial(true);
    try {
      await api.put("/profile/social-links", socialLinks);
      await refreshCompletion();
      Alert.alert("Saved ✓", "Social links updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save.");
    } finally { setSavingSocial(false); }
  };

  const saveSkills = async () => {
    setSavingSkills(true);
    try {
      const payload = [
        ...technicalSkills.map(name => ({ type: "technical", name })),
        ...softSkills.map(name => ({ type: "soft", name })),
        ...languages.map(name => ({ type: "language", name })),
      ];
      await api.put("/profile/skills", { skills: payload });
      await refreshCompletion();
      Alert.alert("Saved ✓", "Skills updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save.");
    } finally { setSavingSkills(false); }
  };

  const saveEducations = async () => {
    setSavingEdu(true);
    try {
      await api.put("/profile/educations", { educations });
      await refreshCompletion();
      Alert.alert("Saved ✓", "Education updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save.");
    } finally { setSavingEdu(false); }
  };

  const saveExperiences = async () => {
    setSavingExp(true);
    try {
      await api.put("/profile/experiences", { experiences });
      await refreshCompletion();
      Alert.alert("Saved ✓", "Experience updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save.");
    } finally { setSavingExp(false); }
  };

  const saveProjects = async () => {
    setSavingProj(true);
    try {
      await api.put("/profile/projects", { projects });
      await refreshCompletion();
      Alert.alert("Saved ✓", "Projects updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save.");
    } finally { setSavingProj(false); }
  };

  const saveCertifications = async () => {
    setSavingCerts(true);
    try {
      await api.put("/profile/certifications", { certifications });
      await refreshCompletion();
      Alert.alert("Saved ✓", "Certifications updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save.");
    } finally { setSavingCerts(false); }
  };

  // ── Resume Upload ──────────────────────────────────────────────────────────

  const handleResumeUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets[0];
      setUploadingResume(true);

      const formData = new FormData();
      formData.append("resume", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? "application/pdf",
      } as any);

      const res = await api.upload("/profile/resume", formData);
      const data = res?.data ?? res;

      // Set resume metadata
      setResume(data?.resume ?? data);
      await refreshCompletion();

      // If extracted data comes back, show the extraction modal
      if (data?.extracted) {
        setExtractedData(data.extracted);
        setShowExtraction(true);
      } else {
        Alert.alert("Uploaded ✓", `${file.name} uploaded successfully.`);
      }
    } catch (e: any) {
      Alert.alert("Upload Failed", e?.message ?? "Could not upload resume.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResume = () => {
    Alert.alert("Delete Resume", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingResume(true);
          try {
            await api.delete("/profile/resume");
            setResume(null);
            await refreshCompletion();
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Could not delete resume.");
          } finally {
            setDeletingResume(false);
          }
        },
      },
    ]);
  };

  // ── Apply Extracted Data ───────────────────────────────────────────────────

  const applyExtracted = (d: ExtractedData) => {
    if (d.profile) {
      setProfileData(prev => ({ ...prev, ...d.profile }));
    }
    if (d.social) {
      setSocialLinks(prev => ({ ...prev, ...d.social }));
    }
    if (d.skills) {
      if (d.skills.technical?.length) setTechnicalSkills(d.skills.technical);
      if (d.skills.soft?.length)      setSoftSkills(d.skills.soft);
      if (d.skills.languages?.length) setLanguages(d.skills.languages);
    }
    if (d.education?.length) {
      setEducations(d.education.map(e => ({
        level: e.level ?? "other",
        institution: e.institution ?? "",
        degree: e.degree,
        field_of_study: e.field_of_study,
        start_date: e.start_date,
        end_date: e.end_date,
        grade: e.grade,
      })));
    }
    if (d.experience?.length) {
      setExperiences(d.experience.map(e => ({
        company: e.company ?? "",
        designation: e.designation ?? "",
        start_date: e.start_date ?? "",
        end_date: e.end_date,
        currently_working: e.currently_working ?? false,
        description: e.description,
        technologies: e.technologies,
      })));
    }
    if (d.projects?.length) {
      setProjects(d.projects.map(p => ({
        name: p.name ?? "",
        description: p.description,
        technologies: p.technologies,
        project_url: p.project_url,
        github_url: p.github_url,
      })));
    }
    if (d.certifications?.length) {
      setCertifications(d.certifications.map(c => ({
        name: c.name ?? "",
        organization: c.organization ?? "",
        issue_date: c.issue_date,
        credential_url: c.credential_url,
      })));
    }
    setShowExtraction(false);
    Alert.alert("Applied ✓", "Extracted data has been mapped to your profile. Review and save each section.");
  };

  // ── Skill helpers ──────────────────────────────────────────────────────────

  const addSkill = (type: "tech" | "soft" | "lang") => {
    if (type === "tech" && techInput.trim()) {
      setTechnicalSkills(p => [...p, techInput.trim()]); setTechInput("");
    }
    if (type === "soft" && softInput.trim()) {
      setSoftSkills(p => [...p, softInput.trim()]); setSoftInput("");
    }
    if (type === "lang" && langInput.trim()) {
      setLanguages(p => [...p, langInput.trim()]); setLangInput("");
    }
  };

  const handleLogout = async () => { setShowLogout(false); await logout(); };

  // ── Render Guards ──────────────────────────────────────────────────────────

  if (loading) return <Loading message="Loading profile…" />;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="person-circle-outline" size={70} color={colors.textSecondary} />
        <Text style={[styles.noUserText, { color: colors.text }]}>No user session found</Text>
        <Text style={[styles.noUserSubText, { color: colors.textSecondary }]}>Please login again.</Text>
      </View>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase();

  // ── Section renderer ───────────────────────────────────────────────────────

  const renderSection = () => {

    // ── ACCOUNT (unchanged display) ─────────────────────────────────────────
    if (activeSection === "account") {
      return (
        <>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
            <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
            <View style={styles.verifiedRow}>
              <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
              {user.isEmailVerified && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
            </View>
          </View>

          {/* Account Info Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Account Information</Text>

            {[
              { label: "First Name",   value: user.firstName, icon: "person-outline" },
              { label: "Last Name",    value: user.lastName,  icon: "person-outline" },
              { label: "Email",        value: user.email,     icon: "mail-outline" },
              { label: "User ID",      value: String(user.id), icon: "finger-print-outline" },
            ].map(row => (
              <View key={row.label} style={styles.infoRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name={row.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{row.label}</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{row.value}</Text>
                </View>
              </View>
            ))}

            {/* Email Verified */}
            <View style={styles.infoRow}>
              <View style={[styles.iconBox, { backgroundColor: user.isEmailVerified ? "#10B98115" : "#F59E0B15" }]}>
                <Ionicons
                  name={user.isEmailVerified ? "checkmark-circle-outline" : "alert-circle-outline"}
                  size={20}
                  color={user.isEmailVerified ? "#10B981" : "#F59E0B"}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Email Status</Text>
                <Text style={[styles.value, { color: user.isEmailVerified ? "#10B981" : "#F59E0B" }]}>
                  {user.isEmailVerified ? "Verified" : "Not Verified"}
                </Text>
              </View>
            </View>
          </View>

          {/* Logout */}
          <Pressable
            onPress={() => setShowLogout(true)}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </>
      );
    }

    // ── PROFESSIONAL ────────────────────────────────────────────────────────
    if (activeSection === "professional") {
      return (
        <SectionCard
          title="Professional Details" icon="briefcase-outline"
          colors={colors} onSave={saveProfile} saving={savingProfile}
        >
          <StyledInput label="Current Job Title" value={profileData.current_job_title ?? ""} onChangeText={v => setProfileData(p => ({ ...p, current_job_title: v }))} placeholder="e.g. Senior React Native Developer" colors={colors} />
          <StyledInput label="Current Company"   value={profileData.current_company   ?? ""} onChangeText={v => setProfileData(p => ({ ...p, current_company:   v }))} placeholder="e.g. Google" colors={colors} />
          <StyledInput label="Phone"             value={profileData.phone             ?? ""} onChangeText={v => setProfileData(p => ({ ...p, phone:             v }))} placeholder="+91 9999999999" keyboardType="phone-pad" colors={colors} />
          <StyledInput label="Location"          value={profileData.location          ?? ""} onChangeText={v => setProfileData(p => ({ ...p, location:          v }))} placeholder="Mumbai, India" colors={colors} />

          <View style={fs.group}>
            <FieldLabel text="Employment Type" colors={colors} />
            <SelectOptions
              options={EMPLOYMENT_TYPES}
              selected={profileData.employment_type ?? ""}
              onSelect={v => setProfileData(p => ({ ...p, employment_type: v }))}
              colors={colors}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <StyledInput label="Total Experience"    value={profileData.total_experience    ?? ""} onChangeText={v => setProfileData(p => ({ ...p, total_experience:    v }))} placeholder="5 years" colors={colors} />
            </View>
            <View style={{ flex: 1 }}>
              <StyledInput label="Relevant Experience" value={profileData.relevant_experience ?? ""} onChangeText={v => setProfileData(p => ({ ...p, relevant_experience: v }))} placeholder="3 years" colors={colors} />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <StyledInput label="Current Salary"  value={profileData.current_salary  ?? ""} onChangeText={v => setProfileData(p => ({ ...p, current_salary:  v }))} placeholder="₹12 LPA" colors={colors} />
            </View>
            <View style={{ flex: 1 }}>
              <StyledInput label="Expected Salary" value={profileData.expected_salary ?? ""} onChangeText={v => setProfileData(p => ({ ...p, expected_salary: v }))} placeholder="₹18 LPA" colors={colors} />
            </View>
          </View>

          <StyledInput label="Notice Period"        value={profileData.notice_period        ?? ""} onChangeText={v => setProfileData(p => ({ ...p, notice_period:        v }))} placeholder="30 days / Immediate" colors={colors} />
          <StyledInput label="Preferred Locations"  value={profileData.preferred_locations  ?? ""} onChangeText={v => setProfileData(p => ({ ...p, preferred_locations:  v }))} placeholder="Remote, Bangalore, Mumbai" colors={colors} />
          <StyledInput label="Professional Summary" value={profileData.summary              ?? ""} onChangeText={v => setProfileData(p => ({ ...p, summary:              v }))} placeholder="Brief summary about yourself…" multiline colors={colors} />
        </SectionCard>
      );
    }

    // ── SOCIAL ──────────────────────────────────────────────────────────────
    if (activeSection === "social") {
      return (
        <SectionCard
          title="Social Links" icon="share-social-outline"
          colors={colors} onSave={saveSocial} saving={savingSocial}
          accent="#0EA5E9"
        >
          {[
            { label: "LinkedIn",  key: "linkedin" as keyof SocialLinks, placeholder: "https://linkedin.com/in/...", icon: "logo-linkedin"  },
            { label: "GitHub",    key: "github"   as keyof SocialLinks, placeholder: "https://github.com/...",     icon: "logo-github"    },
            { label: "Portfolio", key: "portfolio"as keyof SocialLinks, placeholder: "https://yoursite.com",       icon: "globe-outline"  },
          ].map(({ label, key, placeholder }) => (
            <StyledInput
              key={key}
              label={label}
              value={socialLinks[key] ?? ""}
              onChangeText={v => setSocialLinks(p => ({ ...p, [key]: v }))}
              placeholder={placeholder}
              keyboardType="url"
              autoCapitalize="none"
              colors={colors}
            />
          ))}
        </SectionCard>
      );
    }

    // ── SKILLS ──────────────────────────────────────────────────────────────
    if (activeSection === "skills") {
      const renderSkillBlock = (
        title: string,
        list: string[],
        input: string,
        setInput: (v: string) => void,
        onAdd: () => void,
        onRemove: (i: number) => void,
        accent: string,
      ) => (
        <View style={{ marginBottom: 20 }}>
          <Text style={[{ color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 10 }]}>{title}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {list.map((s, i) => (
              <SkillTag key={i} name={s} onRemove={() => onRemove(i)} colors={colors} />
            ))}
            {list.length === 0 && (
              <Text style={[{ color: colors.textSecondary, fontSize: 13 }]}>No {title.toLowerCase()} added yet</Text>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              style={[fs.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder={`Add ${title.toLowerCase()}…`}
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={onAdd}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[{ width: 44, height: 44, borderRadius: 10, backgroundColor: accent, alignItems: "center", justifyContent: "center" }]}
              onPress={onAdd}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );

      return (
        <SectionCard
          title="Skills" icon="code-slash-outline"
          colors={colors} onSave={saveSkills} saving={savingSkills}
          accent="#8B5CF6"
        >
          {renderSkillBlock(
            "Technical Skills", technicalSkills, techInput, setTechInput,
            () => addSkill("tech"),
            (i) => setTechnicalSkills(p => p.filter((_, idx) => idx !== i)),
            "#6366F1",
          )}
          {renderSkillBlock(
            "Soft Skills", softSkills, softInput, setSoftInput,
            () => addSkill("soft"),
            (i) => setSoftSkills(p => p.filter((_, idx) => idx !== i)),
            "#10B981",
          )}
          {renderSkillBlock(
            "Languages", languages, langInput, setLangInput,
            () => addSkill("lang"),
            (i) => setLanguages(p => p.filter((_, idx) => idx !== i)),
            "#0EA5E9",
          )}
        </SectionCard>
      );
    }

    // ── EDUCATION ───────────────────────────────────────────────────────────
    if (activeSection === "education") {
      const updateEdu = (i: number, field: keyof Education, value: any) => {
        setEducations(p => p.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
      };

      return (
        <SectionCard
          title="Education" icon="school-outline"
          colors={colors} onSave={saveEducations} saving={savingEdu}
          accent="#F59E0B"
        >
          {educations.map((edu, i) => (
            <EntryCard key={i} index={i} onRemove={() => setEducations(p => p.filter((_, idx) => idx !== i))} colors={colors}>
              <View style={fs.group}>
                <FieldLabel text="Level" colors={colors} />
                <SelectOptions
                  options={[...EDUCATION_LEVELS]}
                  selected={edu.level}
                  onSelect={v => updateEdu(i, "level", v)}
                  colors={colors}
                />
              </View>
              <StyledInput label="Institution" required value={edu.institution} onChangeText={v => updateEdu(i, "institution", v)} placeholder="MIT, IIT Bombay…" colors={colors} />
              <StyledInput label="Degree"      value={edu.degree ?? ""} onChangeText={v => updateEdu(i, "degree", v)} placeholder="B.Tech, M.Sc…" colors={colors} />
              <StyledInput label="Field of Study" value={edu.field_of_study ?? ""} onChangeText={v => updateEdu(i, "field_of_study", v)} placeholder="Computer Science" colors={colors} />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <StyledInput label="Start Date" value={edu.start_date ?? ""} onChangeText={v => updateEdu(i, "start_date", v)} placeholder="2018-06-01" colors={colors} />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledInput label="End Date" value={edu.end_date ?? ""} onChangeText={v => updateEdu(i, "end_date", v)} placeholder="2022-05-31" colors={colors} />
                </View>
              </View>
              <StyledInput label="Grade / CGPA" value={edu.grade ?? ""} onChangeText={v => updateEdu(i, "grade", v)} placeholder="9.2 CGPA / 85%" colors={colors} />
            </EntryCard>
          ))}
          <AddBtn label="Add Education" onPress={() => setEducations(p => [...p, { level: "bachelor", institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", grade: "" }])} colors={colors} />
        </SectionCard>
      );
    }

    // ── EXPERIENCE ──────────────────────────────────────────────────────────
    if (activeSection === "experience") {
      const updateExp = (i: number, field: keyof Experience, value: any) => {
        setExperiences(p => p.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
      };

      return (
        <SectionCard
          title="Work Experience" icon="business-outline"
          colors={colors} onSave={saveExperiences} saving={savingExp}
          accent="#6366F1"
        >
          {experiences.map((exp, i) => (
            <EntryCard key={i} index={i} onRemove={() => setExperiences(p => p.filter((_, idx) => idx !== i))} colors={colors}>
              <StyledInput label="Company"     required value={exp.company}     onChangeText={v => updateExp(i, "company",     v)} placeholder="Google" colors={colors} />
              <StyledInput label="Designation" required value={exp.designation} onChangeText={v => updateExp(i, "designation", v)} placeholder="Senior Engineer" colors={colors} />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <StyledInput label="Start Date" required value={exp.start_date} onChangeText={v => updateExp(i, "start_date", v)} placeholder="2020-01-01" colors={colors} />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledInput label="End Date" value={exp.end_date ?? ""} onChangeText={v => updateExp(i, "end_date", v)} placeholder="2023-12-31" editable={!exp.currently_working} colors={colors} />
                </View>
              </View>

              {/* Currently Working Toggle */}
              <TouchableOpacity
                style={[cw.row, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => {
                  updateExp(i, "currently_working", !exp.currently_working);
                  if (!exp.currently_working) updateExp(i, "end_date", "");
                }}
              >
                <View style={[cw.checkbox, {
                  backgroundColor: exp.currently_working ? colors.primary : "transparent",
                  borderColor: exp.currently_working ? colors.primary : colors.border,
                }]}>
                  {exp.currently_working && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[cw.label, { color: colors.text }]}>Currently working here</Text>
              </TouchableOpacity>

              <StyledInput label="Description"  value={exp.description  ?? ""} onChangeText={v => updateExp(i, "description",  v)} placeholder="Describe your responsibilities and achievements…" multiline colors={colors} />
              <StyledInput label="Technologies" value={exp.technologies ?? ""} onChangeText={v => updateExp(i, "technologies", v)} placeholder="React Native, Node.js, AWS…" colors={colors} />
            </EntryCard>
          ))}
          <AddBtn label="Add Experience" onPress={() => setExperiences(p => [...p, { company: "", designation: "", start_date: "", end_date: "", currently_working: false, description: "", technologies: "" }])} colors={colors} />
        </SectionCard>
      );
    }

    // ── PROJECTS ────────────────────────────────────────────────────────────
    if (activeSection === "projects") {
      const updateProj = (i: number, field: keyof Project, value: any) => {
        setProjects(p => p.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
      };

      return (
        <SectionCard
          title="Projects" icon="folder-open-outline"
          colors={colors} onSave={saveProjects} saving={savingProj}
          accent="#10B981"
        >
          {projects.map((proj, i) => (
            <EntryCard key={i} index={i} onRemove={() => setProjects(p => p.filter((_, idx) => idx !== i))} colors={colors}>
              <StyledInput label="Project Name" required value={proj.name} onChangeText={v => updateProj(i, "name", v)} placeholder="My Awesome App" colors={colors} />
              <StyledInput label="Description"  value={proj.description ?? ""} onChangeText={v => updateProj(i, "description", v)} placeholder="What does this project do?" multiline colors={colors} />
              <StyledInput label="Technologies" value={proj.technologies ?? ""} onChangeText={v => updateProj(i, "technologies", v)} placeholder="React Native, Firebase…" colors={colors} />
              <StyledInput label="Live URL"     value={proj.project_url ?? ""} onChangeText={v => updateProj(i, "project_url", v)} placeholder="https://myapp.com" keyboardType="url" autoCapitalize="none" colors={colors} />
              <StyledInput label="GitHub URL"   value={proj.github_url  ?? ""} onChangeText={v => updateProj(i, "github_url",  v)} placeholder="https://github.com/…"  keyboardType="url" autoCapitalize="none" colors={colors} />
            </EntryCard>
          ))}
          <AddBtn label="Add Project" onPress={() => setProjects(p => [...p, { name: "", description: "", technologies: "", project_url: "", github_url: "" }])} colors={colors} />
        </SectionCard>
      );
    }

    // ── CERTIFICATIONS ──────────────────────────────────────────────────────
    if (activeSection === "certifications") {
      const updateCert = (i: number, field: keyof Certification, value: any) => {
        setCertifications(p => p.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
      };

      return (
        <SectionCard
          title="Certifications" icon="ribbon-outline"
          colors={colors} onSave={saveCertifications} saving={savingCerts}
          accent="#EC4899"
        >
          {certifications.map((cert, i) => (
            <EntryCard key={i} index={i} onRemove={() => setCertifications(p => p.filter((_, idx) => idx !== i))} colors={colors}>
              <StyledInput label="Certification Name" required value={cert.name}         onChangeText={v => updateCert(i, "name",           v)} placeholder="AWS Solutions Architect" colors={colors} />
              <StyledInput label="Issuing Organization" required value={cert.organization} onChangeText={v => updateCert(i, "organization",   v)} placeholder="Amazon Web Services" colors={colors} />
              <StyledInput label="Issue Date"          value={cert.issue_date     ?? ""} onChangeText={v => updateCert(i, "issue_date",     v)} placeholder="2023-06-15" colors={colors} />
              <StyledInput label="Credential URL"      value={cert.credential_url ?? ""} onChangeText={v => updateCert(i, "credential_url", v)} placeholder="https://verify.cert.link" keyboardType="url" autoCapitalize="none" colors={colors} />
            </EntryCard>
          ))}
          <AddBtn label="Add Certification" onPress={() => setCertifications(p => [...p, { name: "", organization: "", issue_date: "", credential_url: "" }])} colors={colors} />
        </SectionCard>
      );
    }

    // ── RESUME ──────────────────────────────────────────────────────────────
    if (activeSection === "resume") {
      const fileSizeKB = resume ? Math.round(resume.file_size / 1024) : 0;
      const uploadDate = resume
        ? new Date(resume.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "";

      return (
        <>
          {/* Current Resume */}
          {resume ? (
            <View style={[rs.resumeCard, { backgroundColor: colors.card, borderColor: "#BBF7D0" }]}>
              <View style={rs.resumeCardLeft}>
                <View style={[rs.resumeIcon, { backgroundColor: "#D1FAE5" }]}>
                  <Ionicons name="document-text" size={28} color="#059669" />
                </View>
                <View style={rs.resumeInfo}>
                  <Text style={[rs.resumeName, { color: colors.text }]} numberOfLines={2}>
                    {resume.original_filename}
                  </Text>
                  <Text style={[rs.resumeMeta, { color: colors.textSecondary }]}>
                    {fileSizeKB} KB · Uploaded {uploadDate}
                  </Text>
                </View>
              </View>
              <View style={rs.resumeActions}>
                <TouchableOpacity
                  style={[rs.actionBtn, { backgroundColor: "#EDE9FE" }]}
                  onPress={handleResumeUpload}
                  disabled={uploadingResume}
                >
                  {uploadingResume
                    ? <ActivityIndicator size="small" color="#7C3AED" />
                    : <Ionicons name="refresh-outline" size={16} color="#7C3AED" />
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  style={[rs.actionBtn, { backgroundColor: "#FEE2E2" }]}
                  onPress={handleDeleteResume}
                  disabled={deletingResume}
                >
                  {deletingResume
                    ? <ActivityIndicator size="small" color="#DC2626" />
                    : <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[rs.uploadArea, { borderColor: colors.primary, backgroundColor: colors.card }]}
              onPress={handleResumeUpload}
              disabled={uploadingResume}
              activeOpacity={0.75}
            >
              {uploadingResume ? (
                <>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[rs.uploadTitle, { color: colors.primary }]}>Uploading…</Text>
                  <Text style={[rs.uploadSub, { color: colors.textSecondary }]}>Please wait</Text>
                </>
              ) : (
                <>
                  <View style={[rs.uploadIconWrap, { backgroundColor: colors.primary + "15" }]}>
                    <Ionicons name="cloud-upload-outline" size={44} color={colors.primary} />
                  </View>
                  <Text style={[rs.uploadTitle, { color: colors.text }]}>Upload Your Resume</Text>
                  <Text style={[rs.uploadSub, { color: colors.textSecondary }]}>
                    PDF, DOC or DOCX · Max 10MB
                  </Text>
                  <View style={[rs.uploadBtn, { backgroundColor: colors.primary }]}>
                    <Ionicons name="attach-outline" size={16} color="#fff" />
                    <Text style={rs.uploadBtnText}>Choose File</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Info box */}
          <View style={[rs.infoBox, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
            <Ionicons name="sparkles-outline" size={18} color="#2563EB" />
            <View style={{ flex: 1 }}>
              <Text style={rs.infoTitle}>Auto-Extract with AI</Text>
              <Text style={rs.infoText}>
                After uploading, Pitchera automatically extracts your experience, education, skills and
                projects from the resume and maps them to editable fields for review.
              </Text>
            </View>
          </View>

          {/* Tips */}
          <View style={[sw.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={sw.head}>
              <View style={[sw.iconWrap, { backgroundColor: "#FEF3C715" }]}>
                <Ionicons name="bulb-outline" size={18} color="#D97706" />
              </View>
              <Text style={[sw.title, { color: colors.text }]}>Resume Tips</Text>
            </View>
            <View style={[sw.divider, { backgroundColor: colors.border }]} />
            <View style={sw.body}>
              {[
                "Use PDF format for best extraction results",
                "Include clear section headers (Education, Experience, Skills)",
                "Add LinkedIn and GitHub URLs in your resume",
                "Quantify achievements with numbers and metrics",
              ].map((tip, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center", flexShrink: 0 }]}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#D97706" }}>{i + 1}</Text>
                  </View>
                  <Text style={[{ flex: 1, fontSize: 13, lineHeight: 20, color: colors.textSecondary }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      );
    }

    return null;
  };

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Top Bar (unchanged) ─────────────────────────────────────────── */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Profile</Text>
        </View>

        {/* ── Progress Bar ────────────────────────────────────────────────── */}
        <View style={[prs.progressWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <ProgressBar pct={completion.percentage} colors={colors} />
          {completion.missing_sections?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              <View style={{ flexDirection: "row", gap: 6, paddingRight: 4 }}>
                <Text style={[prs.missLabel, { color: colors.textSecondary }]}>Missing:</Text>
                {completion.missing_sections.map(sec => (
                  <TouchableOpacity
                    key={sec}
                    style={[prs.missPill, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}
                    onPress={() => setActiveSection(sec as SectionId)}
                  >
                    <Text style={prs.missPillText}>{sec.charAt(0).toUpperCase() + sec.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* ── Section Tabs ─────────────────────────────────────────────────── */}
        <View style={[prs.tabsWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
          >
            {SECTIONS.map(sec => (
              <TabPill
                key={sec.id}
                sec={sec}
                active={activeSection === sec.id}
                missing={completion.missing_sections?.includes(sec.id) ?? false}
                colors={colors}
                onPress={() => setActiveSection(sec.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Section Content ──────────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          {renderSection()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Logout Confirmation (unchanged) ─────────────────────────────────── */}
      <PopupModal
        visible={showLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        confirmBackgroundColor="#9F2B2B"
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />

      {/* ── Extraction Modal ─────────────────────────────────────────────────── */}
      <ExtractionModal
        visible={showExtraction}
        data={extractedData}
        onAccept={applyExtracted}
        onClose={() => setShowExtraction(false)}
        colors={colors}
      />
    </>
  );
}

// ─── Checkbox style ───────────────────────────────────────────────────────────

const cw = StyleSheet.create({
  row:      { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  label:    { fontSize: 14, fontWeight: "600" },
});

// ─── Progress section wrap ────────────────────────────────────────────────────

const prs = StyleSheet.create({
  progressWrap: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  tabsWrap:     { borderBottomWidth: 1 },
  missLabel:    { fontSize: 12, fontWeight: "600", alignSelf: "center" },
  missPill:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  missPillText: { fontSize: 12, fontWeight: "700", color: "#92400E" },
});

// ─── Resume section styles ────────────────────────────────────────────────────

const rs = StyleSheet.create({
  resumeCard:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 16, ...Platform.select({ ios: { shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:6 }, android: { elevation: 1 }, web: { boxShadow:"0 1px 6px rgba(0,0,0,0.05)" } as any }) },
  resumeCardLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  resumeIcon:     { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  resumeInfo:     { flex: 1 },
  resumeName:     { fontSize: 14, fontWeight: "700" },
  resumeMeta:     { fontSize: 12, marginTop: 4 },
  resumeActions:  { gap: 8 },
  actionBtn:      { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  uploadArea:     { borderWidth: 2, borderStyle: "dashed", borderRadius: 16, padding: 36, alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 },
  uploadIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  uploadTitle:    { fontSize: 18, fontWeight: "800", textAlign: "center" },
  uploadSub:      { fontSize: 13, textAlign: "center" },
  uploadBtn:      { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 6 },
  uploadBtnText:  { color: "#fff", fontSize: 14, fontWeight: "700" },
  infoBox:        { flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  infoTitle:      { fontSize: 14, fontWeight: "700", color: "#1E40AF", marginBottom: 4 },
  infoText:       { fontSize: 13, color: "#1E40AF", lineHeight: 20 },
});

// ─── ORIGINAL STYLES (100% unchanged) ─────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 28,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 16,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
  },
  email: {
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 3,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 24,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
  noUserText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 15,
  },
  noUserSubText: {
    fontSize: 14,
    marginTop: 6,
  },
});