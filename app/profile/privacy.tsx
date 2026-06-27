import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

export default function PrivacyPolicy() {
  const { colors } = useTheme();

  const Section = ({ title, children }: any) => (
    <Card style={{ borderRadius: 26, padding: 20, marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      <View style={{ gap: 10 }}>{children}</View>
    </Card>
  );

  const Bullet = ({ children }: any) => (
    <Text style={{ color: colors.textMuted, fontSize: 15, lineHeight: 22 }}>
      • {children}
    </Text>
  );

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 60,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          LiftBuddy — Privacy Policy
        </Text>

        <Text
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: colors.textMuted,
            marginBottom: 24,
          }}
        >
          We respect your privacy. This document explains what information we
          collect, how we use it, who we share it with, and the choices you
          have.
        </Text>

        <Section title="Data We Collect">
          <Bullet>Basic profile details (name, email, phone)</Bullet>
          <Bullet>Ride history and completed rides</Bullet>
          <Bullet>
            Contact information for verification and notifications
          </Bullet>
          <Bullet>Location data during ride tracking or ride creation</Bullet>
          <Bullet>Uploaded files (profile picture, ID/licence images)</Bullet>
        </Section>

        <Section title="How We Use Data">
          <Bullet>Provide and improve the app experience</Bullet>
          <Bullet>Match riders and drivers and enable ride tracking</Bullet>
          <Bullet>Support verification and account security</Bullet>
          <Bullet>Deliver ride-related notifications and messages</Bullet>
        </Section>

        <Section title="Sharing & Disclosure">
          <Bullet>LiftBuddy does not sell your personal data</Bullet>
          <Bullet>
            Minimal data may be shared with required service providers
          </Bullet>
          <Bullet>Ride details are shared only between participants</Bullet>
        </Section>

        <Section title="Data Retention">
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            We retain user data and ride records to provide service features,
            comply with legal obligations, and for internal analytics. You may
            request deletion of your account and associated data by contacting
            support.
          </Text>
        </Section>

        <Section title="Your Rights">
          <Bullet>Request access to your data</Bullet>
          <Bullet>Request correction or deletion</Bullet>
          <Bullet>Request account removal</Bullet>
          <Bullet>Opt out of certain communications</Bullet>
        </Section>

        <Section title="Security">
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            We take reasonable measures to protect your data, including password
            hashing and restricted access. However, no system is completely
            secure. Please use strong passwords and safeguard your account.
          </Text>
        </Section>

        <Section title="Third-Party Services">
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            The app may link to third-party services that operate independently.
            LiftBuddy is not responsible for external privacy practices.
          </Text>
        </Section>

        <Section title="Children">
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            The service is intended for users 18 years and older. We do not
            knowingly collect personal data from children under 18.
          </Text>
        </Section>

        <Section title="Changes to Policy">
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            We may update this policy from time to time. Significant changes
            will be communicated through the app or via email.
          </Text>
        </Section>

        <Section title="Contact">
          <Text style={{ color: colors.textMuted, fontSize: 15 }}>
            For privacy requests or questions:
          </Text>
          <Text
            style={{
              color: colors.primary,
              fontSize: 15,
              marginTop: 6,
              fontWeight: "600",
            }}
          >
            himanshugavarkar@liftbuddy.in
          </Text>
          <Text
            style={{
              color: colors.primary,
              fontSize: 15,
              marginTop: 6,
              fontWeight: "600",
            }}
          >
            jayapaliwal@liftbuddy.in
          </Text>
        </Section>
      </ScrollView>
    </ScreenWrapper>
  );
}
