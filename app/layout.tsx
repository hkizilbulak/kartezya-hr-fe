import "@/styles/theme.scss";
import "react-toastify/dist/ReactToastify.css";

import type { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import { NextAuthProvider } from "@/app/providers";

export const metadata: Metadata = {
  title: "Kartezya HR Sistemi",
  description: "Kartezya HR Yönetim Sistemi",
  icons: {
    icon: [{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }],
    shortcut: "/favicon-32x32.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="bg-light">
        <NextAuthProvider>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </NextAuthProvider>
      </body>
    </html>
  );
}
