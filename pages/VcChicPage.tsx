import React from 'react'
import StorePage from './StorePage'
import AdsPanelVcChic from '@/components/ads/AdsPanelVcChic'
import { RoleGuard } from '@/components/auth/RoleGuard'

const VcChicPage: React.FC = () => (
  <div className="space-y-12">
    <StorePage storeName="VcChic" apiEndpoint="/api/vcchic" accentColor="blue" />
    <RoleGuard roles={['ceo', 'gestor_vcchic']}>
      <AdsPanelVcChic />
    </RoleGuard>
  </div>
)

export default VcChicPage
