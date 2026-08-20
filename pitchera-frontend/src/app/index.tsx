import React, { useEffect } from "react";
import Head from "expo-router/head";
import { useRouter } from "expo-router";

import HomePage from "@/components/HomePage";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/(app)/dashboard");
    }
  }, [isLoading, isAuthenticated]);

  return (
    <>
      <Head>
        <title>Pitchera - Job Search & Application Management</title>

        <meta
          name="description"
          content="Pitchera helps job seekers manage their professional profile, resumes, job applications, and personalized job application emails in one organized workspace."
        />

        <meta name="robots" content="index, follow" />

        <link
          rel="canonical"
          href="https://pitchera.netlify.app/"
        />

        <meta
          property="og:title"
          content="Pitchera - Job Search & Application Management"
        />

        <meta
          property="og:description"
          content="Pitchera helps job seekers manage their professional profile, resumes, job applications, and personalized job application emails in one organized workspace."
        />

        <meta
          property="og:url"
          content="https://pitchera.netlify.app/"
        />

        <meta
          property="og:type"
          content="website"
        />

        <meta
          property="og:site_name"
          content="Pitchera"
        />
      </Head>

      <HomePage />
    </>
  );
}