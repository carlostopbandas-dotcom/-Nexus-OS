import React from 'react';
import StorePage from './StorePage';

const ShopifyPage: React.FC = () => (
  <StorePage storeName="Moriel" apiEndpoint="/api/shopify" accentColor="teal" />
);

export default ShopifyPage;
