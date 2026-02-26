import React from 'react';
import StorePage from './StorePage';

const SezoPage: React.FC = () => (
  <StorePage storeName="Sezo" apiEndpoint="/api/sezo" accentColor="orange" />
);

export default SezoPage;
