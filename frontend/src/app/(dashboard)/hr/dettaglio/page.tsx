import { Suspense } from 'react';
import EmployeeDetailClientPage from '@/components/hr/EmployeeDetailClientPage';

export default function HrEmployeeDetailPage() {
  return (
    <Suspense fallback={null}>
      <EmployeeDetailClientPage />
    </Suspense>
  );
}
