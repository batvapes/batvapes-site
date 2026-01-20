import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateProductForm from "./CreateProductForm";
import DeleteProductButton from "./DeleteProductButton";

function euro(priceCents: number) {
  return (priceCents / 100).toLocaleString("nl-BE", {
    style: "currency",
    currency: "EUR",
  });
}

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Producten</h1>

      <CreateProductForm />

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Naam</th>
            <th className="text-left p-2">Prijs</th>
            <th className="text-left p-2">Stock</th>
            <th className="text-left p-2">Actief</th>
            <th className="text-left p-2">Status</th>
            <th className="text-right p-2">Acties</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const inStock = p.stockQty > 0;
            const sellable = p.isActive && inStock;

            return (
              <tr key={p.id} className="border-b">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{euro(p.priceCents)}</td>
                <td className="p-2">{p.stockQty}</td>
                <td className="p-2">{p.isActive ? "Ja" : "Nee"}</td>
                <td className="p-2">
                  {sellable ? "Verkoopbaar" : inStock ? "Inactief" : "Uitverkocht"}
                </td>

                <td className="p-2 text-right whitespace-nowrap">
                  <Link
                    href={`/dashboard/products/${p.id}/edit`}
                    className="px-3 py-1 border rounded hover:bg-gray-100"
                  >
                    Bewerk
                  </Link>
                  <DeleteProductButton id={p.id} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
