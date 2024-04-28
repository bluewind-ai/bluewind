'use client';

import FAQ from '@/components/FAQ';
import PricingTable2 from '@/components/PricingTable2';
// import { useState } from 'react';

export default function Pricing() {
  // const [isAnnual, setIsAnnual] = useState<boolean>(true);

  return (
    <div>
      <PricingTable2 />
      <FAQ />
    </div>
  );
}
