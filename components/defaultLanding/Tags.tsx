import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import tags from 'components/defaultLanding/data/tags.json';

const Tags = () => {
  const [selectedTag, setSelectedTag] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const { tag } = router.query;
    setSelectedTag(Array.isArray(tag) ? tag[0] || 'all' : tag || 'all');
  }, [router.query]);

  const handleTagClick = (tagId) => {
    setSelectedTag(tagId);
    router.push({
      pathname: router.pathname,
      query: { ...router.query, tag: tagId === 'all' ? '' : tagId },
    });
  };

  // Sort tags alphabetically by label
  const sortedTags = tags.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="tag-container">
      {sortedTags.map((tag) => (
        <button
          key={tag.id}
          className={`btn btn-sm ${selectedTag === tag.id ? 'selected' : ''}`}
          onClick={() => handleTagClick(tag.id)}
        >
          {tag.label}
        </button>
      ))}
      <style jsx>{`
        .tag-container {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          min-height: 50px;
        }
        .btn {
          background-color: #e0e0e0;
          color: #000;
          transition: background-color 0.2s ease;
          margin-right: 8px;
          margin-bottom: 8px;
        }
        .btn.selected {
          background-color: #000;
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default Tags;
