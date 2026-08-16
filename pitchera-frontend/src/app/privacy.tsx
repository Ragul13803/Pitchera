import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function PrivacyPolicy() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>

        <Text style={styles.updated}>
          Last updated: August 16, 2026
        </Text>

        <Text style={styles.intro}>
          Welcome to PITCHERA. PITCHERA is a job-seeker platform that helps
          users manage their professional profile, resumes, job applications,
          and personalized job application emails.
        </Text>

        <Text style={styles.heading}>1. Information We Collect</Text>

        <Text style={styles.text}>
          When you use PITCHERA, we may collect information that you provide
          directly to us, including your name, contact information,
          professional profile information, employment history, education,
          skills, resume information, job application information, and other
          information you choose to provide.
        </Text>

        <Text style={styles.text}>
          We may also collect information about how you use PITCHERA, such as
          application activity, features used, and technical information
          necessary to operate and secure the service.
        </Text>

        <Text style={styles.heading}>2. Resume and Professional Information</Text>

        <Text style={styles.text}>
          PITCHERA allows you to create and maintain a professional profile
          and upload or manage resumes. This information is used to provide
          job-search and job-application management functionality.
        </Text>

        <Text style={styles.text}>
          Your resume and professional information may be used to help you
          prepare and personalize job applications and related communications.
        </Text>

        <Text style={styles.heading}>3. Job Application Information</Text>

        <Text style={styles.text}>
          PITCHERA allows you to record and manage job applications, including
          information such as companies, positions, application dates,
          application status, job descriptions, notes, and related
          information that you choose to store.
        </Text>

        <Text style={styles.heading}>4. Google Account and Gmail Access</Text>

        <Text style={styles.text}>
          PITCHERA allows you to connect your Google account to provide
          Gmail-related functionality. Connecting your Google account is
          optional and requires your authorization through Google's OAuth
          authorization process.
        </Text>

        <Text style={styles.text}>
          Depending on the permissions you authorize, PITCHERA may access
          information from your Google account and Gmail account that is
          necessary to provide the requested functionality.
        </Text>

        <Text style={styles.heading}>5. How We Use Gmail Data</Text>

        <Text style={styles.text}>
          PITCHERA uses authorized Gmail access to provide job-application
          communication features that you explicitly request.
        </Text>

        <Text style={styles.text}>
          For example, PITCHERA may use your authorized Gmail account to send
          personalized job application emails to recipients selected by you.
          These emails may include information from your professional profile,
          resume, job application, or other information you choose to include.
        </Text>

        <Text style={styles.text}>
          PITCHERA does not use Gmail data for advertising, does not sell Gmail
          data, and does not use Gmail data for purposes unrelated to providing
          the features you request.
        </Text>

        <Text style={styles.heading}>6. Google API Services User Data</Text>

        <Text style={styles.text}>
          PITCHERA's use and transfer of information received from Google APIs
          will comply with the Google API Services User Data Policy, including
          the Limited Use requirements where applicable.
        </Text>

        <Text style={styles.heading}>7. Data Sharing</Text>

        <Text style={styles.text}>
          We do not sell your personal information, resume information, job
          application information, or Google user data.
        </Text>

        <Text style={styles.text}>
          We may use trusted service providers to operate PITCHERA, including
          providers for hosting, databases, authentication, storage,
          infrastructure, security, and other services necessary to operate
          the platform.
        </Text>

        <Text style={styles.text}>
          Such providers may process information only as necessary to provide
          services to PITCHERA and are subject to appropriate obligations
          relating to the protection of information.
        </Text>

        <Text style={styles.heading}>8. Email Sending</Text>

        <Text style={styles.text}>
          When you choose to send a job application email through PITCHERA,
          the email is sent using the Gmail account that you have connected and
          authorized.
        </Text>

        <Text style={styles.text}>
          You are responsible for reviewing the recipient, subject, content,
          attachments, and other information before sending an email.
        </Text>

        <Text style={styles.heading}>9. Data Storage and Security</Text>

        <Text style={styles.text}>
          We use reasonable technical and organizational measures designed to
          protect your information from unauthorized access, loss, misuse,
          alteration, or disclosure.
        </Text>

        <Text style={styles.text}>
          However, no online service can guarantee absolute security.
        </Text>

        <Text style={styles.heading}>10. Google Account Permissions</Text>

        <Text style={styles.text}>
          You can review or revoke PITCHERA's access to your Google account
          through your Google Account security settings.
        </Text>

        <Text style={styles.heading}>11. Data Deletion</Text>

        <Text style={styles.text}>
          You may request deletion of your PITCHERA account and associated
          personal information by contacting us through the support contact
          provided on the PITCHERA website.
        </Text>

        <Text style={styles.text}>
          Revoking Google permissions prevents PITCHERA from obtaining new
          information through the revoked Google authorization, although
          information that was previously stored by PITCHERA may require a
          separate deletion request.
        </Text>

        <Text style={styles.heading}>12. Children's Privacy</Text>

        <Text style={styles.text}>
          PITCHERA is intended for job seekers and is not directed toward
          children. We do not knowingly collect personal information from
          children.
        </Text>

        <Text style={styles.heading}>13. Third-Party Services</Text>

        <Text style={styles.text}>
          PITCHERA may integrate with third-party services, including Google
          services. Your use of those services may also be subject to the
          respective provider's terms and privacy policies.
        </Text>

        <Text style={styles.heading}>14. Changes to This Privacy Policy</Text>

        <Text style={styles.text}>
          We may update this Privacy Policy from time to time. When we make
          material changes, we will update the "Last updated" date displayed
          on this page.
        </Text>

        <Text style={styles.heading}>15. Contact Us</Text>

        <Text style={styles.text}>
          If you have questions about this Privacy Policy or how PITCHERA
          handles your information, please contact us through the support
          contact provided on the PITCHERA website.
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