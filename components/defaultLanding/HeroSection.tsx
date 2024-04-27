import { useTranslation } from 'next-i18next';
import { ReactElement } from 'react';

type HeroSectionProps = {
  id?: string;
};

const HeroSection = ({ id }: HeroSectionProps): ReactElement => {
  const { t } = useTranslation('common');

  return (
    <div id={id} className="hero py-10">
      <div className="hero-content text-center">
        <div className="max-w-7xl">
          <h1 className="text-5xl font-bold">
            Open-source AI automations to grow your business
          </h1>
          <p className="py-6 text-2xl font-normal">
            Save time and money by reusing automations proven to generate
            revenue.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
