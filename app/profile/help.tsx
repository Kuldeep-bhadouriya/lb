import React, { useState } from "react";
import {
  LayoutAnimation,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const faqs = [
  {
    q: "What is LiftBuddy?",
    a: "LiftBuddy is a ride-sharing platform where people traveling on the same route can share rides to save money and fuel.",
  },
  {
    q: "How is it different from Uber or Rapido?",
    a: "LiftBuddy is not a taxi service. It connects real people already traveling. You share rides instead of booking drivers.",
  },
  {
    q: "Who can use LiftBuddy?",
    a: "Anyone with a vehicle (driver) or anyone looking for a ride (passenger), as long as they are verified users.",
  },
  {
    q: "Is LiftBuddy safe?",
    a: "Yes. It includes user verification, ratings, reviews, and ride sharing options. Future updates include ID verification and SOS.",
  },
  {
    q: "How do I earn money?",
    a: "Drivers earn a small contribution amount to help cover fuel costs.",
  },
  {
    q: "How much do passengers pay?",
    a: "Usually less than autos or cabs. You only pay a shared cost.",
  },
  {
    q: "Can I choose who I travel with?",
    a: "Yes, you can check profiles, ratings, and accept or reject requests.",
  },
  {
    q: "What if my route changes?",
    a: "You can update or cancel the ride anytime and inform via chat.",
  },
  {
    q: "Is it legal?",
    a: "LiftBuddy operates as a ride-sharing platform, not a commercial taxi service.",
  },
  {
    q: "What about female safety?",
    a: "Same-gender ride preference and verification features are planned for better safety.",
  },
  {
    q: "How do I trust others?",
    a: "Check ratings, profiles, and ride history before accepting.",
  },
  {
    q: "Do you have chat?",
    a: "Yes, you can chat before confirming rides.",
  },
  {
    q: "Payment methods?",
    a: "Currently cash/UPI. In-app payments coming soon.",
  },
];

const issues = [
  {
    q: "OTP Not Received",
    a: "Wait 30–60 seconds, tap Resend OTP, and check network or spam messages.",
  },
  {
    q: "Ride Not Confirmed",
    a: "Driver may not have accepted. Try another ride or check internet connection.",
  },
  {
    q: "Driver Delayed",
    a: "Contact via chat/call. Wait briefly or cancel if needed.",
  },
  {
    q: "Unable to Find Rides",
    a: "Adjust pickup/drop, try different time, or check later.",
  },
  {
    q: "Verification Problem",
    a: "Upload clear documents and ensure correct details.",
  },
  {
    q: "App Not Working",
    a: "Restart app, update, clear cache, or reinstall.",
  },
  {
    q: "Can't Contact User",
    a: "Check internet, restart app, try again.",
  },
  {
    q: "Ride Cancelled",
    a: "Book another ride and check ratings before booking.",
  },
  {
    q: "Safety Concern",
    a: "Cancel immediately, report user, and share ride details with family.",
  },
];

function AccordionItem({ item, colors }: any) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      style={{
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 15.5,
          fontWeight: "600",
          color: colors.text,
        }}
      >
        {item.q}
      </Text>

      {open && (
        <Text
          style={{
            marginTop: 8,
            fontSize: 14.5,
            lineHeight: 20,
            color: colors.textMuted,
          }}
        >
          {item.a}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function HelpSupport() {
  const { colors } = useTheme();

  const linkStyle = {
    fontSize: 15.5,
    color: colors.primary,
    marginTop: 10,
    fontWeight: "600" as const,
  };

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
            fontSize: 28,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 10,
          }}
        >
          Help Center
        </Text>

        <Text
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: colors.textMuted,
            marginBottom: 24,
          }}
        >
          Find answers, resolve issues, or contact us if you need help.
        </Text>

        <Card style={{ borderRadius: 26, padding: 20, marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 10,
            }}
          >
            Contact Support
          </Text>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL("mailto:liftbuddy.connect@gmail.com")
            }
          >
            <Text style={linkStyle}>liftbuddy.connect@gmail.com</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL("tel:+919752231105")}
          >
            <Text style={linkStyle}>+91 97522 31105</Text>
          </TouchableOpacity>
        </Card>

        <Card style={{ borderRadius: 26, padding: 20, marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 10,
            }}
          >
            FAQs
          </Text>

          {faqs.map((item, index) => (
            <AccordionItem key={index} item={item} colors={colors} />
          ))}
        </Card>

        <Card style={{ borderRadius: 26, padding: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 10,
            }}
          >
            Troubleshooting
          </Text>

          {issues.map((item, index) => (
            <AccordionItem key={index} item={item} colors={colors} />
          ))}
        </Card>

        <Text
          style={{
            marginTop: 24,
            fontSize: 13.5,
            textAlign: "center",
            color: colors.textMuted,
          }}
        >
          “LiftBuddy is not a taxi service. It’s a community helping each other
          travel smarter.”
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}
