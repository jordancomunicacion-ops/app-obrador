import PackagedProductForm from '@/app/ui/products/packaged-form';
import { createPackagedProduct } from '@/app/lib/actions/packaged-products';

export default function CreatePackagedProductPage() {
  return <PackagedProductForm action={createPackagedProduct} />;
}
