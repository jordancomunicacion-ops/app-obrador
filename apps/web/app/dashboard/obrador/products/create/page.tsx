import ObradorProductForm from '@/app/ui/obrador/product-form';
import { createObradorProduct } from '@/app/lib/actions/obrador-products';

export default function CreateObradorProductPage() {
  return <ObradorProductForm action={createObradorProduct} />;
}
