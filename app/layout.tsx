import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Podcast Highlight Finder",
  description: "Find podcast moments faster with transcripts and ranked candidates.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
