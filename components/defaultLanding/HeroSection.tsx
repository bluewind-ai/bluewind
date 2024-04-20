import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { ReactElement, useState } from 'react';
type HeroSectionProps = {
  id?: string;
};

const HeroSection = ({ id }: HeroSectionProps): ReactElement => {
  const { t } = useTranslation('common');
  const [domainName, setDomainName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle the submission of the domain name
    console.log('Submitted domain name:', domainName);
    // You can make an API call or perform any other necessary actions here
  };
  return (
    <div id={id} className="hero py-52">
      <div className="hero-content text-center">
        <div className="max-w-7xl">
          <h1 className="text-5xl font-bold"> {t('enterprise-saas-kit')}</h1>
          <p className="py-6 text-2xl font-normal">
            {t('kickstart-your-enterprise')}
          </p>
          <div className="flex items-center justify-center gap-2 ">
            <form
              onSubmit={handleSubmit}
              className="flex items-center justify-center gap-2"
            >
              <input
                type="text"
                placeholder="your-company.com"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                className="input input-bordered"
              />
              <button
                type="submit"
                className="btn btn-primary px-8 no-underline"
              >
                {t('get-started')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
