import './global.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-50 dark:bg-slate-950 transition-colors duration-300">
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
