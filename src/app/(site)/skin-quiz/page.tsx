import type { Metadata } from "next";
import { SkinQuiz } from "./SkinQuiz";

export const metadata: Metadata = {
  title: "Skin Quiz",
  description: "Tell us what your skin needs and we'll match you with the right Elanmist formula.",
};

export default function SkinQuizPage() {
  return <SkinQuiz />;
}
