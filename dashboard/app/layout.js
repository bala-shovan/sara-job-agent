import './globals.css';

export const metadata = {
  title: 'Sara, job search agent',
  description: 'Sara finds the five best-matching jobs every morning and tracks each application from suggestion to offer.',
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
