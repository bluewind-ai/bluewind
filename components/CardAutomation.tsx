import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import features from 'components/defaultLanding/data/features.json';

const AlbumCard = ({ feature }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/automations/${feature.uuid}`);
  };

  const [imageSrc, setImageSrc] = useState(
    feature.image_format ? `${feature.uuid}.${feature.image_format}` : null
  );

  const handleImageError = () => {
    setImageSrc('xyzt.jpg'); // Specify the path to your fallback image
  };

  return (
    <div
      className="card w-96 bg-base-100 shadow-xl hover:shadow-2xl transition duration-300 ease-in-out cursor-pointer"
      onClick={handleClick}
    >
      <div className="card-body">
        <h2 className="card-title items-center justify-center h-14 overflow-hidden">
          {feature.title}
          {feature.isNew && <div className="badge badge-secondary">NEW</div>}
        </h2>
        <figure className="w-full h-48 bg-gray-200">
          <img
            src={imageSrc}
            alt={feature.title}
            onError={handleImageError}
            className="w-full h-full object-cover"
          />
        </figure>
        <p className="h-20 overflow-hidden">{feature.description}</p>
        <div className="card-actions justify-end">
          {feature.tags.map((tag, index) => (
            <div key={index} className="badge badge-outline">
              {tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AlbumCardList = () => {
  const router = useRouter();
  const { tag } = router.query;

  const filteredFeatures = tag
    ? features.filter((feature) => feature.tags.includes(tag))
    : features.filter((feature) => !feature.tags.includes('coming-soon'));

  return (
    <div
      key={tag}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {filteredFeatures.map((feature) => (
        <AlbumCard key={feature.uuid} feature={feature} />
      ))}
    </div>
  );
};

export default AlbumCardList;
