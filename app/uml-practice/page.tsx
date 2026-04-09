import { redirect } from "next/navigation";

// /uml-practice → redirect to editor (new diagram)
export default function UMLPracticePage() {
  redirect("/uml-practice/new");
}
