import { prisma } from "@/lib/prisma";
import EditProductForm from "./EditProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return <div className="p-6">Product niet gevonden</div>;

  return (
    <div className="p-6">
      <EditProductForm product={product} />
    </div>
  );
}
