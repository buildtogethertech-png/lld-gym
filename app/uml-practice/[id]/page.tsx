import { notFound } from "next/navigation";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import UMLEditor from "../UMLEditor";

export default async function EditDiagramPage({ params }: { params: { id: string } }) {
  const uid = await getUid();
  if (!uid) {
    // Return editor without pre-loaded data; client will redirect to login on save
    return <UMLEditor />;
  }

  const diagram = await prisma.diagram.findFirst({
    where: { id: params.id, userId: uid },
  });

  if (!diagram) notFound();

  return (
    <UMLEditor
      diagramId={diagram.id}
      initialTitle={diagram.title}
      initialNodes={JSON.parse(diagram.nodes)}
      initialEdges={JSON.parse(diagram.edges)}
    />
  );
}
