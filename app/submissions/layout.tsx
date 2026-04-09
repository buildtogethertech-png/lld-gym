import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My submissions — LLD Hub",
  description: "Review all your AI evaluations across problems in one place.",
};

export default function SubmissionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
