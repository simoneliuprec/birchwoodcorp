'use client';
import '../../i18n'; // initialize i18n once

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
