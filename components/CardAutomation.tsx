import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Highlight } from 'react-instantsearch';

export const AlbumCard = ({ feature }) => {
  const router = useRouter();

  const handleClick = (event) => {
    if (event.metaKey || event.ctrlKey) {
      // Command key (macOS) or Ctrl key (Windows) is pressed
      event.preventDefault();
      if (feature.profile_view_link) {
        window.open(feature.profile_view_link, '_blank', 'noopener,noreferrer');
      } else {
        const newWindow = window.open(
          `/automations/${feature.uuid}`,
          '_blank',
          'noopener,noreferrer'
        );
        if (newWindow) {
          newWindow.opener = null;
        }
      }
    } else {
      // Regular click without Command or Ctrl key
      if (feature.profile_view_link) {
        window.open(feature.profile_view_link, '_blank', 'noopener,noreferrer');
      } else {
        router.push(`/automations/${feature.uuid}`);
      }
    }
  };

  const [imageSrc, setImageSrc] = useState(
    feature.image_format ? `${feature.uuid}.${feature.image_format}` : ''
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
        {feature.title && (
          <Highlight
            className="card-title items-center justify-center h-14 overflow-hidden"
            attribute="title"
            hit={feature}
          />
        )}
        {!feature.title && (
          <h2 className="card-title items-center justify-center h-14 overflow-hidden">
            {feature.title}
            {feature.isNew && <div className="badge badge-secondary">NEW</div>}
          </h2>
        )}{' '}
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
          {feature.tags &&
            feature.tags.map((tag, index) => (
              <div key={index} className="badge badge-outline">
                {tag}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export const AlbumCardList = ({ features }) => {
  const router = useRouter();
  const { tag } = router.query ?? '';

  const filteredFeatures = tag
    ? features.filter((feature) =>
        typeof tag === 'string'
          ? feature.tags.includes(tag)
          : feature.tags.some((t) => tag.includes(t))
      )
    : features.filter((feature) => !feature.tags.includes('coming-soon'));

  return (
    <div
      key={String(tag)} // Convert tag to a string
      className="flex flex-wrap gap-4 justify-center"
    >
      {filteredFeatures.map((feature) => (
        <AlbumCard key={feature.uuid} feature={feature} />
      ))}
    </div>
  );
};

export default AlbumCardList;
