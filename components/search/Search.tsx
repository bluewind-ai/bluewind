import algoliasearch from 'algoliasearch/lite';
import {
  InstantSearch,
  RefinementList,
  Hits,
  SearchBox,
} from 'react-instantsearch';
import { AlbumCard } from '../CardAutomation';
// import './Search.css';

const searchClient = algoliasearch(
  'OZECKU5YEJ',
  'fec132f11fe7c5342d4a29a1bc768938'
);

function Hit({ hit }) {
  return (
    <article>
      <AlbumCard feature={hit} />
    </article>
  );
}

export function Search() {
  return (
    <InstantSearch
      searchClient={searchClient}
      indexName="automations"
      insights={true}
    >
      {/* <RefinementList attribute="brand" /> */}
      <SearchBox placeholder="Search" autoFocus={false} />
      <RefinementList attribute="tags" />
      <Hits hitComponent={Hit} />
    </InstantSearch>
  );
}
