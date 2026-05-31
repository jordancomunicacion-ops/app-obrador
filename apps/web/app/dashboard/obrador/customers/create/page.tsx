import ObradorCustomerForm from '@/app/ui/obrador/customer-form';
import { createObradorCustomer } from '@/app/lib/actions/obrador-customers';

export default function CreateObradorCustomerPage() {
  return <ObradorCustomerForm action={createObradorCustomer} />;
}
