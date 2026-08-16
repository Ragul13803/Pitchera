import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function TermsOfService() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>

        <Text style={styles.updated}>
          Last updated: August 16, 2026
        </Text>

        <Text style={styles.intro}>
          These Terms of Service govern your use of PITCHERA, a job-seeker
          platform that helps users manage professional profiles, resumes,
          job applications, and personalized job application emails.
        </Text>

        <Text style={styles.heading}>1. Acceptance of These Terms</Text>

        <Text style={styles.text}>
          By creating an account or using PITCHERA, you agree to these Terms
          of Service. If you do not agree with these terms, you should not use
          PITCHERA.
        </Text>

        <Text style={styles.heading}>2. About PITCHERA</Text>

        <Text style={styles.text}>
          PITCHERA provides tools that allow job seekers to manage their
          professional information, resumes, job applications, and
          job-application communications.
        </Text>

        <Text style={styles.heading}>3. Your Account</Text>

        <Text style={styles.text}>
          You are responsible for maintaining the security of your PITCHERA
          account and for activities performed through your account.
        </Text>

        <Text style={styles.text}>
          You agree to provide accurate information and to keep information
          associated with your account reasonably up to date.
        </Text>

        <Text style={styles.heading}>4. Professional Profile and Resume</Text>

        <Text style={styles.text}>
          You may create a professional profile and upload or manage resumes
          through PITCHERA.
        </Text>

        <Text style={styles.text}>
          You are responsible for ensuring that information contained in your
          profile and resumes is accurate and that you have the right to use
          any content you upload.
        </Text>

        <Text style={styles.heading}>5. Job Applications</Text>

        <Text style={styles.text}>
          PITCHERA provides tools for organizing and managing job applications.
          You are responsible for the accuracy of application information and
          for deciding which employers and positions you apply to.
        </Text>

        <Text style={styles.heading}>6. Gmail Integration</Text>

        <Text style={styles.text}>
          PITCHERA may allow you to connect a Google account and use Gmail
          functionality.
        </Text>

        <Text style={styles.text}>
          You control whether to authorize Gmail access. When you authorize
          Gmail access, PITCHERA may use the permissions you grant to provide
          features such as sending personalized job application emails.
        </Text>

        <Text style={styles.heading}>7. Sending Emails</Text>

        <Text style={styles.text}>
          PITCHERA may allow you to prepare and send personalized job
          application emails through your connected Gmail account.
        </Text>

        <Text style={styles.text}>
          You are responsible for reviewing emails before sending them,
          including the recipient, subject, message, resume attachments, and
          other information.
        </Text>

        <Text style={styles.text}>
          PITCHERA does not guarantee that a recipient will receive, read, or
          respond to an email sent through the platform.
        </Text>

        <Text style={styles.heading}>8. Acceptable Use</Text>

        <Text style={styles.text}>
          You agree not to use PITCHERA to send unlawful, fraudulent,
          misleading, abusive, threatening, or unsolicited communications.
        </Text>

        <Text style={styles.text}>
          You must not use PITCHERA to impersonate another person, violate
          another person's rights, interfere with the service, or attempt to
          obtain unauthorized access to accounts or systems.
        </Text>

        <Text style={styles.heading}>9. Third-Party Services</Text>

        <Text style={styles.text}>
          PITCHERA may integrate with third-party services such as Google and
          Gmail. Third-party services are operated by their respective
          providers and may be subject to separate terms and policies.
        </Text>

        <Text style={styles.heading}>10. User Content</Text>

        <Text style={styles.text}>
          You retain responsibility for content that you upload, store,
          create, or transmit through PITCHERA, including resumes,
          professional information, job application information, and email
          content.
        </Text>

        <Text style={styles.heading}>11. Intellectual Property</Text>

        <Text style={styles.text}>
          PITCHERA, including its software, branding, designs, interfaces,
          logos, and other materials, is owned by or licensed to PITCHERA and
          is protected by applicable intellectual property laws.
        </Text>

        <Text style={styles.heading}>12. Service Availability</Text>

        <Text style={styles.text}>
          We may modify, update, suspend, or discontinue features of PITCHERA
          from time to time.
        </Text>

        <Text style={styles.text}>
          We do not guarantee that PITCHERA or any third-party integration
          will always be available, uninterrupted, secure, or error-free.
        </Text>

        <Text style={styles.heading}>13. No Employment Guarantee</Text>

        <Text style={styles.text}>
          PITCHERA is a job-search and application management platform.
          PITCHERA does not guarantee interviews, job offers, employment,
          responses from employers, or any particular employment outcome.
        </Text>

        <Text style={styles.heading}>14. Disclaimer</Text>

        <Text style={styles.text}>
          To the maximum extent permitted by applicable law, PITCHERA is
          provided on an "as available" and "as is" basis without guarantees
          that the service will satisfy every user's requirements.
        </Text>

        <Text style={styles.heading}>15. Limitation of Liability</Text>

        <Text style={styles.text}>
          To the maximum extent permitted by applicable law, PITCHERA will not
          be liable for indirect, incidental, special, consequential, or
          similar damages arising from your use of the service.
        </Text>

        <Text style={styles.heading}>16. Account Suspension or Termination</Text>

        <Text style={styles.text}>
          We may suspend or terminate your access to PITCHERA if you violate
          these Terms, misuse the service, or if suspension or termination is
          necessary to protect users, the service, or comply with legal
          obligations.
        </Text>

        <Text style={styles.heading}>17. Changes to These Terms</Text>

        <Text style={styles.text}>
          We may update these Terms of Service from time to time. When
          material changes are made, we will update the "Last updated" date.
          Continued use of PITCHERA after the updated terms become effective
          constitutes acceptance of the updated terms to the extent permitted
          by law.
        </Text>

        <Text style={styles.heading}>18. Contact Us</Text>

        <Text style={styles.text}>
          If you have questions about these Terms of Service, please contact
          us through the support contact provided on the PITCHERA website.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 24,
    paddingVertical: 48,
  },

  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  updated: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 32,
  },

  intro: {
    fontSize: 17,
    lineHeight: 28,
    color: "#374151",
    marginBottom: 24,
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginTop: 28,
    marginBottom: 12,
  },

  text: {
    fontSize: 16,
    lineHeight: 27,
    color: "#374151",
    marginBottom: 12,
  },
});