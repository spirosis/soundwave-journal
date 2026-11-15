import { AuthGuard } from "../../components/auth/auth-guard";
import { PreviewPlayerProvider } from "../../components/player/preview-player";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <PreviewPlayerProvider>{children}</PreviewPlayerProvider>
    </AuthGuard>
  );
}
