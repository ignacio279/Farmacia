import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Panel Farmacia',
  description: 'Clientes, conversaciones y campañas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen flex bg-white">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </body>
    </html>
  );
}
