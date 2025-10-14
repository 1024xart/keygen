'use client';

import { Window, WindowHeader, WindowContent, Button, MenuList, MenuListItem, Separator } from 'react95';
import { useEffect, useState } from 'react';

const Desktop = dynamic(() => import('./ui95/Desktop'), { ssr: false });

export default function Page() {
  return <Desktop />;
}
function dynamic(
  importer: () => Promise<{ default: React.ComponentType<any> }>,
  options: { ssr: boolean }
) {
  return function DynamicComponent(props: any) {
    const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

    useEffect(() => {
      let mounted = true;
      importer().then((mod) => {
        if (mounted) setComponent(() => mod.default);
      });
      return () => {
        mounted = false;
      };
    }, []);

    if (!Component) return null;
    return <Component {...props} />;
  };
}
