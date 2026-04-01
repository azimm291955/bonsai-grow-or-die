"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const AGE_VERIFIED_KEY = "bonsai_age_verified";

export default function AgeVerification({
  children,
}: {
  children: React.ReactNode;
}) {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AGE_VERIFIED_KEY);
    setVerified(stored === "true");
  }, []);

  const handleYes = () => {
    localStorage.setItem(AGE_VERIFIED_KEY, "true");
    setVerified(true);
  };

  const handleNo = () => {
    window.location.href = "https://bonsaicultivation.com";
  };

  if (verified === null) return null;
  if (verified) return <>{children}</>;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 20% 30%, #2d1b4e 0%, #0a0a0a 45%, #0d2e1a 100%)",
        zIndex: 9999,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "48px 56px",
          maxWidth: "520px",
          width: "90%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
        }}
      >
        <Image
          src="/Bonsai_Rainbow.png"
          alt="Bonsai Cultivation"
          width={280}
          height={90}
          style={{ objectFit: "contain" }}
          priority
        />
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "#1a4d2e",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          Age Verification
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "#666",
            margin: 0,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          We have to ask, are you at least 21 years of age?
        </p>
        <button
          onClick={handleYes}
          style={{
            marginTop: "8px",
            background: "#1a4d2e",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "14px 40px",
            fontSize: "16px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#245f39")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#1a4d2e")}
        >
          YES <span style={{ fontSize: "18px" }}>›</span>
        </button>
        <button
          onClick={handleNo}
          style={{
            background: "none",
            border: "none",
            color: "#333",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textDecoration: "underline",
            cursor: "pointer",
            padding: 0,
          }}
        >
          NO, NOT YET »
        </button>
      </div>
    </div>
  );
}
