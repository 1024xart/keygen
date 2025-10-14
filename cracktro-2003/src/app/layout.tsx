import type { Metadata } from 'next';
import Providers from './providers';
import StyledComponentsRegistry from './sc-registry';

export const metadata: Metadata = {
  title: 'SEQUENCE',
  description: 'Become part of the sequence',
};

export const runtime = 'nodejs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <Providers>{children}</Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}