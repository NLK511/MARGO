'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: '32px', fontFamily: 'system-ui, sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button type="button" onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
