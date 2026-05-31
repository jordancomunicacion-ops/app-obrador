import CustomerForm from '@/app/ui/customers/customer-form';
import { createCustomer } from '@/app/lib/actions/customers';

export default function CreateCustomerPage() {
  return <CustomerForm action={createCustomer} />;
}
