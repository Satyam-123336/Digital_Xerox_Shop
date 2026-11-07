import './globals.css';

export const metadata = {
  title: 'XeroxQ — Skip the queue',
  description: 'Place your print request, get notified when ready.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <header className="bg-ink-900 text-white px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-signal font-bold text-xl tracking-tight">Xerox</span>
            <span className="font-bold text-xl tracking-tight">Q</span>
          </a>
          <span className="text-paper-200 text-sm">Skip the queue.</span>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
