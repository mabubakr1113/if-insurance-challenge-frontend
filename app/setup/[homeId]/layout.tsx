import { ButtonLink, Wordmark } from '@/components/ui';

/** Setup hides the sidebar: just the wordmark and a way out. */
export default function SetupLayout({ children }: LayoutProps<'/setup/[homeId]'>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print flex items-center justify-between gap-3 border-b border-line px-[18px] py-4 wide:px-6">
        <Wordmark />
        <ButtonLink href="/demo" variant="secondary">
          Exit setup
        </ButtonLink>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1100px] flex-1 px-[18px] pt-[22px] pb-[88px] wide:px-12 wide:pt-10 wide:pb-24">
        {children}
      </main>
    </div>
  );
}
