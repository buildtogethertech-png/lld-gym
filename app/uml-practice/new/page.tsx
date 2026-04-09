import type { Metadata } from "next";
import UMLEditor from "../UMLEditor";

export const metadata: Metadata = {
  title: "New Diagram — UML Practice — LLD Hub",
};

export default function NewDiagramPage() {
  return <UMLEditor />;
}
