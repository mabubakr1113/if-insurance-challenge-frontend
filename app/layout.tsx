import type { Metadata } from 'next';
import { Hanken_Grotesk, Newsreader } from 'next/font/google';
import { Toaster } from '@/components/toaster';
import './globals.css';

const newsreader = Newsreader({ variable: '--font-newsreader', subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'] });
const hanken = Hanken_Grotesk({ variable: '--font-hanken', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'If Home Watch (prototype)', template: '%s · If Home Watch' },
  description: 'Helps a family share the care of an empty home after a death: what needs doing, who is on it, and help when nobody can go.',
};

/* Each area brings its own frame: the sidebar shell (home, messages, partner, staff), the setup header or the public header. */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${hanken.variable} h-full`}>
      <body className="min-h-full font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-[10px] focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
