import Link from 'next/link';
import features from './data/features.json';

const sportsData = [
  {
    name: 'Basketball',
    description: 'Styles made for your game.',
    imageAlt: 'Basketball',
    href: '#',
  },
  {
    name: 'Running',
    description: 'Everything you need for every mile.',
    imageAlt: 'Running',
    href: '#',
  },
  {
    name: 'Football',
    description: 'Command the field in game-ready gear.',
    imageAlt: 'Football',
    href: '#',
  },
  {
    name: 'Soccer',
    description: 'Elevate your game with the latest soccer styles.',
    imageAlt: 'Soccer',
    href: '#',
  },
];

export default function Component() {
  return (
    <section className="w-full py-12">
      <div className="container grid gap-6 md:gap-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8"></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 items-start">
          {features.map((feature, index) => (
            <div key={index} className="grid gap-4 relative group">
              <Link className="absolute inset-0 z-10" href="ok">
                <span className="sr-only">View</span>
              </Link>
              <img
                alt={feature.name}
                className="rounded-lg object-cover w-full aspect-[4/3] group-hover:opacity-50 transition-opacity"
                height={400}
                src="/placeholder.svg"
                width={500}
              />
              <div className="grid gap-1">
                <h3 className="font-semibold">{feature.name}</h3>
                <p className="text-sm leading-none">{feature.description}</p>
              </div>
              <p className="font-semibold underline underline-offset-4">Shop</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
