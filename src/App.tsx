import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import { VendorDataProvider } from '@/context/VendorDataContext';
import { RfpCharterProvider } from '@/context/RfpCharterContext';
import HomePage from '@/pages/HomePage';
import CreateRfpPage from '@/pages/CreateRfpPage';
import BidsManagementPage from '@/pages/BidsManagementPage';
import RfpDetailPage from '@/pages/RfpDetailPage';
import VendorBidDetailPage from '@/pages/VendorBidDetailPage';
import AnalystPage from '@/pages/AnalystPage';
import InvoiceManagementPage from '@/pages/InvoiceManagementPage';
import RecentActivityPage from '@/pages/RecentActivityPage';
import { VendorManagementPage, SettingsPage } from '@/pages/ComingSoonPage';

export default function App() {
  return (
    <BrowserRouter>
      <VendorDataProvider>
        <RfpCharterProvider>
          <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rfp/create" element={<CreateRfpPage />} />
            <Route path="/bids" element={<BidsManagementPage />} />
            <Route path="/bids/052" element={<RfpDetailPage />} />
            <Route path="/bids/052/vendor/:id" element={<VendorBidDetailPage />} />
            <Route path="/bids/052/analyst" element={<AnalystPage />} />
            <Route path="/bids/:id" element={<RfpDetailPage />} />
            <Route path="/invoices" element={<InvoiceManagementPage />} />
            <Route path="/vendors" element={<VendorManagementPage />} />
            <Route path="/recent" element={<RecentActivityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
          </Layout>
        </RfpCharterProvider>
      </VendorDataProvider>
    </BrowserRouter>
  );
}
