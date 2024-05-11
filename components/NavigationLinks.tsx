import { useRouter } from 'next/router';

const NavigationLinks = () => {
  const router = useRouter();

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  const navigationLinks = [
    { label: 'Automations', route: '/' },
    { label: 'Contributors', route: '/contributors' },
    { label: 'Stats', route: '/community' },
    { label: 'Pricing', route: '/pricing' },
  ];

  return (
    <>
      {navigationLinks.map((link, index) => (
        <li key={index}>
          <a onClick={() => handleNavigation(link.route)} className="text-xl">
            {link.label}
          </a>
        </li>
      ))}
    </>
  );
};

export default NavigationLinks;
