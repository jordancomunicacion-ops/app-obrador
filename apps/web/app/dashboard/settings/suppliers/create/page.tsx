import SupplierForm from '@/app/ui/suppliers/supplier-form';
import { createSupplier } from '@/app/lib/actions/suppliers';

export default function CreateSupplierPage() {
  return <SupplierForm action={createSupplier} />;
}
