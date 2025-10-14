'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';

export default function StyledComponentsRegistry({
  children,
}: { children: React.ReactNode }) {
  const [sheet] = useState(() => new ServerStyleSheet());

  // Inject server-generated styles into the HTML
  useServerInsertedHTML(() => {
    const styles = sheet.getStyleElement();
    sheet.instance.clearTag();
    return <>{styles}</>;
  });

  // Client: no sheet instance, but still filter invalid DOM props
  if (typeof window !== 'undefined') {
    return (
      <StyleSheetManager shouldForwardProp={(prop) => isPropValid(prop)}>
        {children}
      </StyleSheetManager>
    );
  }

  // Server: collect styles + filter props
  return (
    <StyleSheetManager
      sheet={sheet.instance}
      shouldForwardProp={(prop) => isPropValid(prop)}
    >
      {children}
    </StyleSheetManager>
  );
}
