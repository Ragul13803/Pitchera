import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, router } from "expo-router";

export default function HomePage() {
  const handleGetStarted = () => {
    router.push("/login");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Pitchera</Text>

        <View style={styles.headerLinks}>
          <Link href="/privacy" asChild>
            <Pressable>
              <Text style={styles.headerLink}>Privacy</Text>
            </Pressable>
          </Link>

          <Link href="/terms" asChild>
            <Pressable>
              <Text style={styles.headerLink}>Terms</Text>
            </Pressable>
          </Link>

          <Pressable
            style={styles.signInButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>
        </View>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            JOB SEARCH & APPLICATION PLATFORM
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          Your job search.
          {"\n"}
          <Text style={styles.heroAccent}>Simplified.</Text>
        </Text>

        <Text style={styles.heroDescription}>
          Pitchera helps job seekers manage their professional profile,
          resumes, job applications, and personalized job application
          emails from one place.
        </Text>

        <View style={styles.heroButtons}>
          <Pressable
            style={styles.primaryButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>
              Get Started
            </Text>
          </Pressable>

          <Link href="/privacy" asChild>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>
                Learn More
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ABOUT PITCHERA</Text>

        <Text style={styles.sectionTitle}>
          Everything you need to manage your job search
        </Text>

        <Text style={styles.sectionDescription}>
          Pitchera is a platform designed for job seekers who want a
          simpler way to organize their professional information and
          manage their job applications.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <Feature
          icon="👤"
          title="Professional Profile"
          description="Create and maintain your professional profile with your experience, education, skills, and other career information."
        />

        <Feature
          icon="📄"
          title="Resume Management"
          description="Upload and manage your resumes so your professional documents are organized and ready when you need them."
        />

        <Feature
          icon="💼"
          title="Job Applications"
          description="Organize your job applications and keep track of positions, companies, application status, dates, and notes."
        />

        <Feature
          icon="✉️"
          title="Personalized Emails"
          description="Connect your Gmail account and send personalized job application emails to employers directly from Pitchera."
        />
      </View>

      {/* Gmail */}
      <View style={styles.gmailSection}>
        <View style={styles.gmailIcon}>
          <Text style={styles.gmailIconText}>G</Text>
        </View>

        <View style={styles.gmailContent}>
          <Text style={styles.gmailTitle}>
            Connect your Gmail account
          </Text>

          <Text style={styles.gmailDescription}>
            Pitchera can connect to your Google account when you choose
            to authorize Gmail access. This allows you to send
            personalized job application emails using your connected
            Gmail account.
          </Text>

          <Text style={styles.gmailNote}>
            Gmail access is optional and is only used for features you
            authorize.
          </Text>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>HOW IT WORKS</Text>

        <Text style={styles.sectionTitle}>
          Start managing your applications in minutes
        </Text>
      </View>

      <View style={styles.steps}>
        <Step
          number="1"
          title="Create your profile"
          description="Add your professional information and career details."
        />

        <Step
          number="2"
          title="Add your resume"
          description="Upload and manage your resume in your Pitchera account."
        />

        <Step
          number="3"
          title="Manage applications"
          description="Keep your job applications organized and up to date."
        />

        <Step
          number="4"
          title="Apply with confidence"
          description="Create personalized application emails and send them through your connected Gmail account."
        />
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>
          Ready to simplify your job search?
        </Text>

        <Text style={styles.ctaDescription}>
          Start organizing your professional profile, resumes, and job
          applications with Pitchera.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.primaryButtonText}>
            Get Started with Pitchera
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLogo}>Pitchera</Text>

        <Text style={styles.footerDescription}>
          A job-seeker platform for managing your professional profile,
          resumes, job applications, and personalized application emails.
        </Text>

        <View style={styles.footerLinks}>
          <Link href="/privacy" asChild>
            <Pressable>
              <Text style={styles.footerLink}>
                Privacy Policy
              </Text>
            </Pressable>
          </Link>

          <Text style={styles.footerSeparator}>•</Text>

          <Link href="/terms" asChild>
            <Pressable>
              <Text style={styles.footerLink}>
                Terms of Service
              </Text>
            </Pressable>
          </Link>
        </View>

        <Text style={styles.copyright}>
          © 2026 Pitchera. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>

      <Text style={styles.featureTitle}>{title}</Text>

      <Text style={styles.featureDescription}>
        {description}
      </Text>
    </View>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>

        <Text style={styles.stepDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  scrollContent: {
    paddingBottom: 0,
  },

  header: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },

  headerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },

  headerLink: {
    fontSize: 15,
    color: "#4b5563",
    fontWeight: "500",
  },

  signInButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },

  signInText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },

  hero: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 90,
  },

  badge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    marginBottom: 24,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#2563eb",
  },

  heroTitle: {
    textAlign: "center",
    fontSize: 58,
    lineHeight: 66,
    fontWeight: "800",
    color: "#111827",
  },

  heroAccent: {
    color: "#2563eb",
  },

  heroDescription: {
    maxWidth: 700,
    textAlign: "center",
    fontSize: 19,
    lineHeight: 30,
    color: "#6b7280",
    marginTop: 24,
  },

  heroButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 34,
  },

  primaryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 9,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  secondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 9,
  },

  secondaryButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },

  section: {
    width: "100%",
    maxWidth: 850,
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 40,
  },

  sectionLabel: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 14,
  },

  sectionTitle: {
    textAlign: "center",
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "800",
    color: "#111827",
  },

  sectionDescription: {
    maxWidth: 700,
    textAlign: "center",
    fontSize: 17,
    lineHeight: 28,
    color: "#6b7280",
    marginTop: 18,
  },

  features: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 18,
  },

  featureCard: {
    width: 250,
    minHeight: 250,
    padding: 25,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },

  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  featureIconText: {
    fontSize: 25,
  },

  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  featureDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6b7280",
  },

  gmailSection: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    marginTop: 80,
    padding: 32,
    marginHorizontal: 24,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  gmailIcon: {
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 22,
  },

  gmailIconText: {
    fontSize: 25,
    fontWeight: "800",
    color: "#4285f4",
  },

  gmailContent: {
    flex: 1,
  },

  gmailTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 9,
  },

  gmailDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4b5563",
  },

  gmailNote: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6b7280",
    marginTop: 10,
  },

  steps: {
    width: "100%",
    maxWidth: 850,
    alignSelf: "center",
    paddingHorizontal: 24,
    gap: 20,
  },

  step: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  stepNumber: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  stepNumberText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },

  stepDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: "#6b7280",
  },

  cta: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    alignItems: "center",
    marginTop: 90,
    marginBottom: 90,
    marginHorizontal: 24,
    paddingHorizontal: 24,
    paddingVertical: 60,
    borderRadius: 20,
    backgroundColor: "#111827",
  },

  ctaTitle: {
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
    textAlign: "center",
  },

  ctaDescription: {
    maxWidth: 600,
    color: "#d1d5db",
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 28,
  },

  footer: {
    width: "100%",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 45,
  },

  footerLogo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  footerDescription: {
    maxWidth: 600,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    color: "#6b7280",
    marginTop: 10,
  },

  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 22,
  },

  footerLink: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },

  footerSeparator: {
    color: "#9ca3af",
  },

  copyright: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 18,
  },
});