import { Providers } from './providers';
import OfflineGuard from './OfflineGuard';

export default function AdminLayout({ children }) {
  return (
    <Providers>
      <OfflineGuard>{children}</OfflineGuard>
    </Providers>
  );
}