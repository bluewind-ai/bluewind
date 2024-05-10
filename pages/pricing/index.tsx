'use client';

import FAQ from '@/components/FAQ';
import PricingTable2 from '@/components/PricingTable2';
// import { useState } from 'react';

export default function Pricing() {
  // const [isAnnual, setIsAnnual] = useState<boolean>(true);

  return (
    <div className="mx-auto w-full md:w-5/6 justify-between items-center pt-2 md:pt-4 px-4">
      <PricingTable2 />
      <FAQ />
    </div>
  );
}
