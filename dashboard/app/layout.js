import './globals.css';

const DESCRIPTION = 'A free AI agent that finds the right jobs for you. Every morning Sara scores 1,700+ remote jobs against your experience and emails you only the best matches.';

export const metadata = {
  metadataBase: new URL('https://sara-job-agent.vercel.app'),
  title: 'Sara, job search agent',
  description: DESCRIPTION,
  // The card LinkedIn, Slack and others show when someone shares the link
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Sara',
    title: 'Sara: an AI agent that finds the right jobs for you',
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 627, alt: 'Sara, an AI agent that finds the right jobs for you' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sara: an AI agent that finds the right jobs for you',
    description: DESCRIPTION,
    images: ['/og.png'],
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EEF1F4' },
    { media: '(prefers-color-scheme: dark)', color: '#11171E' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,650;12..96,750&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
