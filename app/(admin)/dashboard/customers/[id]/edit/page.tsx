import { prisma } from "@/lib/prisma";
import EditCustomerForm from "./EditCustomerForm";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) return <div className="p-6">Klant niet gevonden</div>;

  return (
    <div className="p-6">
      <EditCustomerForm customer={customer} />
    </div>
  );
}
