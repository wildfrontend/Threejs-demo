import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: '農夫獨自升級',
  description: '重新找回 2000年史萊姆遊戲區玩網業遊戲的樂趣',
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
