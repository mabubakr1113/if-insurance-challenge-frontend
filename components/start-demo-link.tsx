import { button } from './styles';

export function StartDemoLink({ small = false }: { small?: boolean }) {
  // A full navigation avoids prefetching a route that sets the demo-person cookie.
  return (
    <a href="/demo/start" className={button('primary', small ? 'sm' : 'md')}>
      Try the demo
    </a>
  );
}
