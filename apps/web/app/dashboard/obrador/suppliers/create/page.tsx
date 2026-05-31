import ObradorSupplierForm from '@/app/ui/obrador/supplier-form';
import { createObradorSupplier } from '@/app/lib/actions/obrador-suppliers';

export default function CreateObradorSupplierPage() {
  return <ObradorSupplierForm action={createObradorSupplier} />;
}
