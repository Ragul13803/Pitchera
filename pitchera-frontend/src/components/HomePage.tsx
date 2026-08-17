import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { Link, router } from "expo-router";
import PITCHERA_FULL_LOGO from "@/assets/images/pitchera_full_logo.png";
import { useDeviceType } from "@/hooks/useDeviceType";

export default function HomePage() {

  const {isMobile, width } = useDeviceType();

  const handleGetStarted = () => {
    router.push("/login");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ================= HEADER ================= */}

      <View style={styles.headerWrapper}>
        <View
          style={getHeaderStyle(width)}
        >
          <Pressable onPress={() => router.push("/")}>
            <View style={styles.brand}>
            <View style={styles.logoContainer}>
              <Image
                source={PITCHERA_FULL_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          </Pressable>

          {!isMobile ? (
            <View style={styles.headerLinks}>
              <Link href="/privacy" asChild>
                <Pressable>
                  <Text style={styles.headerLink}>
                    Privacy
                  </Text>
                </Pressable>
              </Link>

              <Link href="/terms" asChild>
                <Pressable>
                  <Text style={styles.headerLink}>
                    Terms
                  </Text>
                </Pressable>
              </Link>

              <Pressable
                style={styles.headerSignIn}
                onPress={handleGetStarted}
              >
                <Text style={styles.headerSignInText}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.mobileSignIn}
              onPress={handleGetStarted}
            >
              <Text style={styles.mobileSignInText}>
                Sign In
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ================= HERO ================= */}

      <View style={styles.heroSection}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <View
          style={getHeroContentStyle(width)}
        >
          <View style={styles.badge}>
            <View style={styles.badgeDot} />

            <Text style={styles.badgeText}>
              SMARTER JOB SEARCH MANAGEMENT
            </Text>
          </View>

          <Text
            style={getHeroTitleStyle(width)}
          >
            Your job search,
            {"\n"}
            <Text style={styles.heroAccent}>
              organized.
            </Text>
          </Text>

          <Text
            style={getHeroDescriptionStyle(width)}
          >
            Keep your professional profile, resumes,
            applications, and personalized outreach in one
            simple workspace.
          </Text>

          <View
            style={getHeroButtonsStyle(isMobile)}
          >
            <Pressable
              style={getPrimaryButtonStyle(isMobile)}
              onPress={handleGetStarted}
            >
              <Text style={styles.primaryButtonText}>
                Get Started
              </Text>

              <Text style={styles.primaryButtonArrow}>
                →
              </Text>
            </Pressable>

            <Link href="/privacy" asChild>
              <Pressable
                style={getSecondaryButtonStyle(isMobile)}
              >
                <Text style={styles.secondaryButtonText}>
                  Learn More
                </Text>
              </Pressable>
            </Link>
          </View>

          <View
            style={getHeroTrustStyle(isMobile)}
          >
            <View style={styles.trustItem}>
              <Text style={styles.trustNumber}>
                01
              </Text>

              <Text style={styles.trustText}>
                One workspace
              </Text>
            </View>

            <View style={styles.trustDivider} />

            <View style={styles.trustItem}>
              <Text style={styles.trustNumber}>
                02
              </Text>

              <Text style={styles.trustText}>
                Organized applications
              </Text>
            </View>

            <View style={styles.trustDivider} />

            <View style={styles.trustItem}>
              <Text style={styles.trustNumber}>
                03
              </Text>

              <Text style={styles.trustText}>
                Personalized outreach
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ================= STATS ================= */}

      <View style={styles.statsWrapper}>
        <View
          style={getStatsStyle(width)}
        >
          <Stat
            number="1"
            label="Professional profile"
            description="Keep your career information organized."
          />

          <Stat
            number="∞"
            label="Applications"
            description="Track as many opportunities as you need."
          />

          <Stat
            number="1"
            label="Central workspace"
            description="Everything stays together in one place."
          />

          <Stat
            number="G"
            label="Gmail integration"
            description="Send personalized emails when authorized."
          />
        </View>
      </View>

      {/* ================= ABOUT ================= */}

      <SectionIntro
        eyebrow="THE PITCHERA WORKSPACE"
        title="Everything you need for a more organized job search."
        description="Searching for a job can quickly become difficult to manage. Pitchera gives you one place to organize your professional information, documents, opportunities, and outreach."
        width={width}
      />

      {/* ================= FEATURES ================= */}

      <View
        style={getFeatureGridStyle(width)}
      >
        <Feature
          icon="👤"
          number="01"
          title="Professional Profile"
          description="Build a central professional profile containing your experience, education, skills, achievements, and career information."
        />

        <Feature
          icon="📄"
          number="02"
          title="Resume Management"
          description="Keep your resumes organized and ready to use whenever a new opportunity comes your way."
        />

        <Feature
          icon="💼"
          number="03"
          title="Application Tracking"
          description="Track companies, positions, application dates, statuses, notes, and other important details."
        />

        <Feature
          icon="✉️"
          number="04"
          title="Personalized Emails"
          description="Create personalized application outreach and send it through your connected Gmail account."
        />
      </View>

      {/* ================= WHY PITCHERA ================= */}

      <View style={styles.darkSection}>
        <View
          style={getDarkSectionContentStyle(width)}
        >
          <View
            style={getDarkSectionTextStyle(width)}
          >
            <Text style={styles.darkEyebrow}>
              WHY PITCHERA?
            </Text>

            <Text
              style={getDarkTitleStyle(width)}
            >
              Stop managing your job search across scattered
              tools.
            </Text>

            <Text style={styles.darkDescription}>
              Spreadsheets, folders, email drafts, notes, and
              bookmarks can make a job search unnecessarily
              complicated. Pitchera brings the essential pieces
              together into one focused workspace.
            </Text>

            <Benefit
              title="One organized workspace"
              description="Keep your professional information and applications together."
            />

            <Benefit
              title="Less repetitive work"
              description="Reuse your career information when managing new opportunities."
            />

            <Benefit
              title="Better visibility"
              description="Know which applications you've submitted and what needs attention."
            />
          </View>

          <View
            style={getDashboardMockupStyle(width)}
          >
            <View style={styles.mockupTop}>
              <View style={styles.mockupDots}>
                <View style={styles.mockupDot} />
                <View style={styles.mockupDot} />
                <View style={styles.mockupDot} />
              </View>

              <Text style={styles.mockupTitle}>
                Applications
              </Text>
            </View>

            <View style={styles.mockupStatsRow}>
              <MockupStat
                number="12"
                label="Applied"
              />

              <MockupStat
                number="5"
                label="In review"
              />

              <MockupStat
                number="2"
                label="Interview"
              />
            </View>

            <MockupApplication
              company="Acme Technologies"
              role="Product Designer"
              status="Interview"
              color="#2563eb"
            />

            <MockupApplication
              company="Northstar Labs"
              role="Frontend Developer"
              status="In Review"
              color="#7c3aed"
            />

            <MockupApplication
              company="Vertex Systems"
              role="Software Engineer"
              status="Applied"
              color="#059669"
            />
          </View>
        </View>
      </View>

      {/* ================= WORKFLOW ================= */}

      <SectionIntro
        eyebrow="HOW IT WORKS"
        title="A simpler workflow from profile to application."
        description="Set up your information once, keep your opportunities organized, and stay on top of your job search."
        width={width}
      />

      <View
        style={getWorkflowStyle(width)}
      >
        <WorkflowStep
          number="01"
          title="Build your profile"
          description="Add your professional experience, education, skills, and career details."
        />

        <WorkflowStep
          number="02"
          title="Add your resume"
          description="Upload and manage the resume you want to use for your applications."
        />

        <WorkflowStep
          number="03"
          title="Track opportunities"
          description="Record companies, positions, dates, statuses, and useful notes."
        />

        <WorkflowStep
          number="04"
          title="Reach out"
          description="Create personalized application emails and send them through Gmail when authorized."
        />
      </View>

      {/* ================= GMAIL ================= */}

      <View
        style={getIntegrationStyle(width)}
      >
        <View style={styles.integrationIcon}>
          <Text style={styles.integrationIconText}>
            G
          </Text>
        </View>

        <View style={styles.integrationContent}>
          <View style={styles.integrationBadge}>
            <Text style={styles.integrationBadgeText}>
              OPTIONAL INTEGRATION
            </Text>
          </View>

          <Text style={styles.integrationTitle}>
            Connect Gmail when you're ready to reach out.
          </Text>

          <Text style={styles.integrationDescription}>
            Pitchera can connect to your Google account when
            you choose to authorize Gmail access. This makes
            it possible to send personalized job application
            emails directly through your connected Gmail
            account.
          </Text>

          <View
            style={getIntegrationPointsStyle(width)}
          >
            <IntegrationPoint text="Authorization is optional" />
            <IntegrationPoint text="You control when access is granted" />
            <IntegrationPoint text="Used only for authorized features" />
          </View>
        </View>
      </View>

      {/* ================= BENEFITS ================= */}

      <View style={styles.benefitsSection}>
        <SectionIntro
          eyebrow="BUILT FOR JOB SEEKERS"
          title="Spend less time organizing. More time applying."
          description="Pitchera is designed around the practical tasks that make job searching easier to manage."
          width={width}
        />

        <View
          style={getBenefitCardsStyle(width)}
        >
          <BenefitCard
            title="Stay organized"
            description="Keep your professional information, resumes, and applications in one consistent system."
          />

          <BenefitCard
            title="Know your progress"
            description="Maintain a clear view of the opportunities you've discovered and the applications you've submitted."
          />

          <BenefitCard
            title="Move faster"
            description="Reduce repetitive setup and keep the information you need ready for the next opportunity."
          />
        </View>
      </View>

      {/* ================= FAQ ================= */}

      <View
        style={getFaqSectionStyle(width)}
      >
        <SectionIntro
          eyebrow="FAQ"
          title="Frequently asked questions."
          description="A few things to know about using Pitchera."
          width={width}
        />

        <View style={styles.faqList}>
          <FAQ
            question="What is Pitchera?"
            answer="Pitchera is a job-search management platform that helps you organize your professional profile, resumes, job applications, and personalized application emails."
          />

          <FAQ
            question="Do I need Gmail to use Pitchera?"
            answer="No. Gmail integration is optional. You can use Pitchera to manage your professional profile, resumes, and applications without connecting Gmail."
          />

          <FAQ
            question="Can I manage multiple applications?"
            answer="Yes. Pitchera is designed to help you keep track of multiple job opportunities and their current status."
          />

          <FAQ
            question="Is my Gmail access required?"
            answer="No. Gmail access is only requested when you choose to use features that require sending emails through your connected Gmail account."
          />
        </View>
      </View>

      {/* ================= FINAL CTA ================= */}

      <View
        style={getFinalCTAStyle(width)}
      >
        <View style={styles.finalCTAGlow} />

        <Text style={styles.finalCTAEyebrow}>
          START YOUR NEXT SEARCH
        </Text>

        <Text
          style={getFinalCTATitleStyle(width)}
        >
          Your next opportunity deserves
          {"\n"}
          a better system.
        </Text>

        <Text
          style={getFinalCTADescriptionStyle(width)}
        >
          Organize your professional profile, resumes,
          applications, and outreach with Pitchera.
        </Text>

        <Pressable
          style={styles.finalCTAButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.finalCTAButtonText}>
            Get Started with Pitchera
          </Text>

          <Text style={styles.finalCTAArrow}>
            →
          </Text>
        </Pressable>
      </View>

      {/* ================= FOOTER ================= */}

      <View style={styles.footer}>
          <View style={styles.brand}>
            <View style={styles.logoContainer}>
              <Image
                source={PITCHERA_FULL_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

        <Text style={styles.footerDescription}>
          A focused workspace for managing your professional
          profile, resumes, job applications, and personalized
          application emails.
        </Text>

        <View style={styles.footerLinks}>
          <Link href="/privacy" asChild>
            <Pressable>
              <Text style={styles.footerLink}>
                Privacy Policy
              </Text>
            </Pressable>
          </Link>

          <Text style={styles.footerSeparator}>
            •
          </Text>

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

/* =========================================================
   COMPONENTS
========================================================= */

function SectionIntro({
  eyebrow,
  title,
  description,
  width,
}: {
  eyebrow: string;
  title: string;
  description: string;
  width: number;
}) {
  return (
    <View style={getSectionIntroStyle(width)}>
      <Text style={styles.sectionEyebrow}>
        {eyebrow}
      </Text>

      <Text
        style={getSectionTitleStyle(width)}
      >
        {title}
      </Text>

      <Text
        style={getSectionDescriptionStyle(width)}
      >
        {description}
      </Text>
    </View>
  );
}

function Stat({
  number,
  label,
  description,
}: {
  number: string;
  label: string;
  description: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNumber}>
        {number}
      </Text>

      <View style={styles.statText}>
        <Text style={styles.statLabel}>
          {label}
        </Text>

        <Text style={styles.statDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function Feature({
  icon,
  number,
  title,
  description,
}: {
  icon: string;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureTop}>
        <View style={styles.featureIcon}>
          <Text style={styles.featureIconText}>
            {icon}
          </Text>
        </View>

        <Text style={styles.featureNumber}>
          {number}
        </Text>
      </View>

      <Text style={styles.featureTitle}>
        {title}
      </Text>

      <Text style={styles.featureDescription}>
        {description}
      </Text>

      <View style={styles.featureLine} />
    </View>
  );
}

function Benefit({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.darkBenefit}>
      <View style={styles.checkCircle}>
        <Text style={styles.checkText}>
          ✓
        </Text>
      </View>

      <View style={styles.darkBenefitContent}>
        <Text style={styles.darkBenefitTitle}>
          {title}
        </Text>

        <Text
          style={styles.darkBenefitDescription}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function MockupStat({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <View style={styles.mockupStat}>
      <Text style={styles.mockupStatNumber}>
        {number}
      </Text>

      <Text style={styles.mockupStatLabel}>
        {label}
      </Text>
    </View>
  );
}

function MockupApplication({
  company,
  role,
  status,
  color,
}: {
  company: string;
  role: string;
  status: string;
  color: string;
}) {
  return (
    <View style={styles.mockupApplication}>
      <View
        style={getCompanyAvatarStyle(color)}
      >
        <Text style={styles.companyAvatarText}>
          {company.charAt(0)}
        </Text>
      </View>

      <View style={styles.mockupApplicationInfo}>
        <Text style={styles.mockupCompany}>
          {company}
        </Text>

        <Text style={styles.mockupRole}>
          {role}
        </Text>
      </View>

      <View
        style={getStatusBadgeStyle(color)}
      >
        <Text
          style={getStatusTextStyle(color)}
        >
          {status}
        </Text>
      </View>
    </View>
  );
}

function WorkflowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.workflowStep}>
      <View style={styles.workflowNumber}>
        <Text style={styles.workflowNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.workflowContent}>
        <Text style={styles.workflowTitle}>
          {title}
        </Text>

        <Text
          style={styles.workflowDescription}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function IntegrationPoint({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.integrationPoint}>
      <View style={styles.integrationCheck}>
        <Text style={styles.integrationCheckText}>
          ✓
        </Text>
      </View>

      <Text style={styles.integrationPointText}>
        {text}
      </Text>
    </View>
  );
}

function BenefitCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.benefitCard}>
      <View style={styles.benefitCardIcon}>
        <Text style={styles.benefitCardIconText}>
          ✦
        </Text>
      </View>

      <Text style={styles.benefitCardTitle}>
        {title}
      </Text>

      <Text
        style={styles.benefitCardDescription}
      >
        {description}
      </Text>
    </View>
  );
}

function FAQ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <View style={styles.faqItem}>
      <View style={styles.faqQuestionRow}>
        <Text style={styles.faqQuestion}>
          {question}
        </Text>

        <View style={styles.faqPlus}>
          <Text style={styles.faqPlusText}>
            +
          </Text>
        </View>
      </View>

      <Text style={styles.faqAnswer}>
        {answer}
      </Text>
    </View>
  );
}

/* =========================================================
   RESPONSIVE HELPERS
========================================================= */

function getHeaderStyle(width: number) {
  return {
    width: "100%" as const,
    maxWidth: 1180,
    alignSelf: "center" as const,
    minHeight: width < 600 ? 64 : 76,
    paddingHorizontal: width < 600 ? 16 : 24,
    paddingVertical: width < 600 ? 10 : 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  };
}

function getHeroContentStyle(width: number) {
  return {
    width: "100%" as const,
    maxWidth: 950,
    alignSelf: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: width < 600 ? 18 : 24,
    paddingTop: width < 600 ? 58 : 92,
    paddingBottom: width < 600 ? 55 : 80,
  };
}

function getHeroTitleStyle(width: number) {
  return {
    textAlign: "center" as const,
    fontSize: width < 380 ? 38 : width < 600 ? 46 : 62,
    lineHeight: width < 380 ? 45 : width < 600 ? 54 : 70,
    fontWeight: "900" as const,
    letterSpacing: width < 600 ? -1 : -1.8,
    color: "#0f172a",
  };
}

function getHeroDescriptionStyle(width: number) {
  return {
    maxWidth: 680,
    paddingHorizontal: width < 600 ? 5 : 0,
    textAlign: "center" as const,
    fontSize: width < 600 ? 15 : 18,
    lineHeight: width < 600 ? 24 : 30,
    color: "#64748b",
    marginTop: width < 600 ? 18 : 24,
  };
}

function getHeroButtonsStyle(isMobile: boolean) {
  return {
    flexDirection: isMobile ? "column" as const : "row" as const,
    alignItems: "center" as const,
    width: isMobile ? "100%" as const : undefined,
    marginTop: 34,
    gap: 10
  };
}

function getPrimaryButtonStyle(isMobile: boolean) {
  return {
    minWidth: isMobile ? undefined : 155,
    width: isMobile ? "100%" as const : undefined,
    maxWidth: isMobile ? 360 : undefined,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 10,
  };
}

function getSecondaryButtonStyle(isMobile: boolean) {
  return {
    minWidth: isMobile ? undefined : 135,
    width: isMobile ? "100%" as const : undefined,
    maxWidth: isMobile ? 360 : undefined,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe2ea",
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: isMobile ? 10 : 0,
  };
}

function getHeroTrustStyle(isMobile: boolean) {
  return {
    flexDirection: isMobile ? "column" as const : "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    width: "100%" as const,
    marginTop: 50,
    paddingTop: 26,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  };
}

function getStatsStyle(width: number) {
  return {
    width: "100%" as const,
    maxWidth: 1120,
    alignSelf: "center" as const,
    paddingHorizontal: width < 600 ? 18 : 24,
    paddingVertical: width < 600 ? 24 : 34,
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
  };
}

function getSectionIntroStyle(width: number) {
  return {
    width: "100%" as const,
    maxWidth: 850,
    alignSelf: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: width < 600 ? 18 : 24,
    paddingTop: width < 600 ? 65 : 95,
    paddingBottom: width < 600 ? 32 : 46,
  };
}

function getSectionTitleStyle(width: number) {
  return {
    maxWidth: 780,
    textAlign: "center" as const,
    fontSize: width < 600 ? 29 : 38,
    lineHeight: width < 600 ? 37 : 46,
    fontWeight: "900" as const,
    letterSpacing: width < 600 ? -0.3 : -0.7,
    color: "#0f172a",
  };
}

function getSectionDescriptionStyle(width: number) {
  return {
    maxWidth: 680,
    textAlign: "center" as const,
    fontSize: width < 600 ? 14 : 16,
    lineHeight: width < 600 ? 22 : 27,
    color: "#64748b",
    marginTop: 18,
  };
}

function getFeatureGridStyle(width: number) {
  return {
    width: "100%" as const,
    maxWidth: 1120,
    alignSelf: "center" as const,
    paddingHorizontal: width < 600 ? 16 : 24,
    flexDirection: width < 600 ? "column" as const : "row" as const,
    flexWrap: "wrap" as const,
  };
}

function getDarkSectionContentStyle(width: number) {
  return {
    width: "100%" as const,
    maxWidth: 1120,
    alignSelf: "center" as const,
    paddingHorizontal: width < 600 ? 18 : 24,
    paddingVertical: width < 600 ? 60 : 90,
    flexDirection: width < 850 ? "column" as const : "row" as const,
    alignItems: width < 850 ? "stretch" as const : "center" as const,
  };
}

function getDarkSectionTextStyle(width: number) {
  return {
    flex: 1,
    width: "100%" as const,
    maxWidth: width < 850 ? undefined : 560,
  };
}

function getDarkTitleStyle(width: number) {
  return {
    fontSize: width < 600 ? 29 : 38,
    lineHeight: width < 600 ? 38 : 47,
    fontWeight: "900" as const,
    color: "#ffffff",
    letterSpacing: width < 600 ? -0.3 : -0.7,
  };
}

function getDashboardMockupStyle(width: number) {
  return {
    width: width < 500 ? "100%" as const : 430,
    maxWidth: "100%" as const,
    marginTop: width < 850 ? 40 : 0,
    padding: width < 600 ? 14 : 18,
    borderRadius: 18,
    backgroundColor: "#ffffff",
  };
}

function getWorkflowStyle(width: number) {
  return {
    width: "100%" as const,
    maxWidth: 850,
    alignSelf: "center" as const,
    paddingHorizontal: width < 600 ? 18 : 24,
  };
}

function getIntegrationStyle(width: number) {
  return {
    width: width < 600 ? "92%" as const : "100%" as const,
    maxWidth: 1050,
    alignSelf: "center" as const,
    marginTop: width < 600 ? 45 : 70,
    paddingHorizontal: width < 600 ? 18 : 30,
    paddingVertical: width < 600 ? 24 : 34,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: width < 700 ? "column" as const : "row" as const,
    alignItems: width < 700 ? "stretch" as const : "flex-start" as const,
  };
}

function getIntegrationPointsStyle(width: number) {
  return {
    flexDirection: width < 600 ? "column" as const : "row" as const,
    flexWrap: "wrap" as const,
    marginTop: 18,
  };
}

function getBenefitCardsStyle(width: number) {
  return {
    width: "100%" as const,
    maxWidth: 1050,
    alignSelf: "center" as const,
    paddingHorizontal: width < 600 ? 16 : 24,
    flexDirection: width < 700 ? "column" as const : "row" as const,
  };
}

function getFaqSectionStyle(width: number) {
  return {
    width: "100%" as const,
    maxWidth: 900,
    alignSelf: "center" as const,
    paddingBottom: width < 600 ? 60 : 100,
  };
}

function getFinalCTAStyle(width: number) {
  return {
    position: "relative" as const,
    overflow: "hidden" as const,
    width: width < 600 ? "92%" as const : "100%" as const,
    maxWidth: 1050,
    alignSelf: "center" as const,
    alignItems: "center" as const,
    marginBottom: width < 600 ? 55 : 90,
    paddingHorizontal: width < 600 ? 18 : 24,
    paddingVertical: width < 600 ? 50 : 72,
    borderRadius: width < 600 ? 18 : 24,
    backgroundColor: "#111827",
  };
}

function getFinalCTATitleStyle(width: number) {
  return {
    textAlign: "center" as const,
    fontSize: width < 600 ? 28 : 38,
    lineHeight: width < 600 ? 36 : 47,
    fontWeight: "900" as const,
    color: "#ffffff",
    letterSpacing: width < 600 ? -0.3 : -0.7,
  };
}

function getFinalCTADescriptionStyle(width: number) {
  return {
    maxWidth: 600,
    paddingHorizontal: width < 600 ? 5 : 0,
    textAlign: "center" as const,
    fontSize: width < 600 ? 14 : 15,
    lineHeight: width < 600 ? 22 : 25,
    color: "#94a3b8",
    marginTop: 16,
    marginBottom: 27,
  };
}

function getCompanyAvatarStyle(color: string) {
  return {
    width: 35,
    height: 35,
    borderRadius: 9,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 10,
    backgroundColor: color,
  };
}

function getStatusBadgeStyle(color: string) {
  return {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: color + "18",
  };
}

function getStatusTextStyle(color: string) {
  return {
    fontSize: 9,
    fontWeight: "800" as const,
    color,
  };
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  scrollContent: {
    paddingBottom: 0,
  },

  /* HEADER */

  headerWrapper: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },

  headerLogo: {
    width: 165,
    height: 48,
  },

  headerLinks: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerLink: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    marginRight: 28,
  },

  headerSignIn: {
    paddingHorizontal: 19,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe2ea",
  },

  headerSignInText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
  },

  mobileSignIn: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
  },

  mobileSignInText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
  },

  /* HERO */

  heroSection: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#f8fbff",
    borderBottomWidth: 1,
    borderBottomColor: "#eef4fb",
  },

  heroGlowOne: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "#dbeafe",
    opacity: 0.45,
    top: -170,
    left: -100,
  },

  heroGlowTwo: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#ede9fe",
    opacity: 0.4,
    right: -100,
    bottom: -140,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    marginBottom: 24,
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2563eb",
    marginRight: 8,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "#2563eb",
  },

  heroAccent: {
    color: "#2563eb",
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  primaryButtonArrow: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },

  secondaryButtonText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "700",
  },

  trustItem: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },

  trustNumber: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2563eb",
    letterSpacing: 1,
  },

  trustText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 5,
    fontWeight: "600",
    textAlign: "center",
  },

  trustDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#dbe2ea",
  },

  /* STATS */

  statsWrapper: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },

  stat: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexGrow: 1,
    flexBasis: 240,
    marginBottom: 15,
    paddingRight: 18,
  },

  statNumber: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    color: "#2563eb",
    marginRight: 12,
  },

  statText: {
    flex: 1,
  },

  statLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  statDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#94a3b8",
    marginTop: 3,
  },

  /* SECTION */

  sectionEyebrow: {
    color: "#2563eb",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 14,
  },

  /* FEATURES */

  featureCard: {
    flexGrow: 1,
    flexBasis: 250,
    minHeight: 270,
    padding: 25,
    margin: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },

  featureTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 13,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },

  featureIconText: {
    fontSize: 23,
  },

  featureNumber: {
    fontSize: 11,
    fontWeight: "900",
    color: "#cbd5e1",
  },

  featureTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
  },

  featureDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: "#64748b",
  },

  featureLine: {
    width: 34,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#2563eb",
    marginTop: 22,
  },

  /* DARK */

  darkSection: {
    width: "100%",
    marginTop: 90,
    backgroundColor: "#0f172a",
  },

  darkEyebrow: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#60a5fa",
    marginBottom: 15,
  },

  darkDescription: {
    fontSize: 15,
    lineHeight: 26,
    color: "#94a3b8",
    marginTop: 18,
    marginBottom: 28,
  },

  darkBenefit: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
  },

  checkCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  checkText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },

  darkBenefitContent: {
    flex: 1,
  },

  darkBenefitTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },

  darkBenefitDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#94a3b8",
    marginTop: 3,
  },

  /* MOCKUP */

  mockupTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },

  mockupDots: {
    flexDirection: "row",
  },

  mockupDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#cbd5e1",
    marginRight: 5,
  },

  mockupTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },

  mockupStatsRow: {
    flexDirection: "row",
    marginVertical: 15,
  },

  mockupStat: {
    flex: 1,
    padding: 12,
    marginRight: 5,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },

  mockupStatNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },

  mockupStatLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },

  mockupApplication: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },

  companyAvatarText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },

  mockupApplicationInfo: {
    flex: 1,
  },

  mockupCompany: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },

  mockupRole: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },

  /* WORKFLOW */

  workflowStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 32,
  },

  workflowNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  workflowNumberText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563eb",
  },

  workflowContent: {
    flex: 1,
    paddingTop: 2,
  },

  workflowTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  workflowDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: "#64748b",
    marginTop: 5,
  },

  /* GMAIL */

  integrationIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  integrationIconText: {
    fontSize: 27,
    fontWeight: "900",
    color: "#4285f4",
  },

  integrationContent: {
    flex: 1,
  },

  integrationBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#e0f2fe",
    marginBottom: 9,
  },

  integrationBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: "#0369a1",
  },

  integrationTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    color: "#111827",
  },

  integrationDescription: {
    fontSize: 14,
    lineHeight: 23,
    color: "#64748b",
    marginTop: 9,
  },

  integrationPoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginRight: 15,
  },

  integrationCheck: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  integrationCheckText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#16a34a",
  },

  integrationPointText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },

  /* BENEFITS */

  benefitsSection: {
    backgroundColor: "#f8fafc",
    marginTop: 90,
    paddingBottom: 80,
  },

  benefitCard: {
    flex: 1,
    minWidth: 240,
    padding: 26,
    margin: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 15,
  },

  benefitCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  benefitCardIconText: {
    fontSize: 19,
    color: "#2563eb",
  },

  benefitCardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  benefitCardDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: "#64748b",
  },

  /* FAQ */

  faqList: {
    paddingHorizontal: 18,
  },

  faqItem: {
    padding: 22,
    marginBottom: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },

  faqQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    paddingRight: 15,
  },

  faqPlus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  faqPlusText: {
    fontSize: 19,
    lineHeight: 21,
    color: "#64748b",
  },

  faqAnswer: {
    fontSize: 13,
    lineHeight: 21,
    color: "#64748b",
    marginTop: 12,
    paddingRight: 10,
  },

  /* CTA */

  finalCTAGlow: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "#2563eb",
    opacity: 0.15,
    top: -180,
    right: -100,
  },

  finalCTAEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: "#60a5fa",
    marginBottom: 14,
    textAlign: "center",
  },

  finalCTADescription: {
    maxWidth: 600,
    textAlign: "center",
    color: "#94a3b8",
  },

  finalCTAButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 23,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#2563eb",
  },

  finalCTAButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },

  finalCTAArrow: {
    fontSize: 18,
    color: "#ffffff",
    marginLeft: 12,
  },

  /* FOOTER */

  footer: {
    width: "100%",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 45,
    backgroundColor: "#ffffff",
  },

  footerLogo: {
    width: 155,
    height: 46,
  },

  footerDescription: {
    maxWidth: 600,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 21,
    color: "#94a3b8",
    marginTop: 10,
  },

  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
  },

  footerLink: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "700",
  },

  footerSeparator: {
    color: "#cbd5e1",
    marginHorizontal: 10,
  },

  copyright: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 18,
  },
    brand: {
    width: "100%",
    alignItems: "center",
    // marginBottom: 24,
  },

  logoContainer: {
    width: 220,
    height: 70,

    borderRadius: 8,

    overflow: "hidden",

    backgroundColor: "#F8FAFC",

    alignItems: "center",
    justifyContent: "center",
  },

  logoImage: {
    width: "100%",
    height: "100%",
  },

});