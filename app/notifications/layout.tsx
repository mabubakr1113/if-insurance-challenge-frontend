import { ActorFrame } from '@/components/actor-frame';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ActorFrame>{children}</ActorFrame>;
}
