import { notFound } from "next/navigation";
import { getProductAdminById, getAdminBrands, getAdminCategories } from "@/lib/admin";
import ProductForm from "../../../_components/ProductForm";

export const metadata = { title: "Editează produs | Admin NexusX" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, brands, categories] = await Promise.all([
    getProductAdminById(id),
    getAdminBrands(),
    getAdminCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-zinc-900">Editează produs</h1>
        <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">{product.name}</p>
      </div>
      <ProductForm product={product} brands={brands} categories={categories} />
    </div>
  );
}
