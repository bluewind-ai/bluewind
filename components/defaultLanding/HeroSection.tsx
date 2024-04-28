import { ReactElement } from 'react';

type HeroSectionProps = {
  id?: string;
};

const HeroSection = ({ id }: HeroSectionProps): ReactElement => {
  return (
    <div id={id} className="hero py-10">
      <div className="hero-content text-center">
        <div className="max-w-7xl">
          <h1 className="text-5xl font-bold">
            The community of AI engineers growing businesses
          </h1>
          <p className="py-6 text-2xl font-normal">
            Build AI automations focused on GTM and make yourself irreplaceable
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
