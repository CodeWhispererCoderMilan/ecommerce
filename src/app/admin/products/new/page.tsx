import { getAdminBrands, getAdminCategories } from "@/lib/admin";
import ProductForm from "../../_components/ProductForm";

export const metadata = { title: "Produs nou | Admin NexusX" };

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    getAdminBrands(),
    getAdminCategories(),
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-zinc-900">Produs nou</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Completează informațiile de mai jos pentru a adăuga un produs nou.</p>
      </div>
      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}
