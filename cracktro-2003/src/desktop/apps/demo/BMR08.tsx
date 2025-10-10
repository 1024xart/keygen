// BMR08.tsx
"use client";

import DemoApp from "./DemoApp";

type ForwardProps = { onClose?: () => void };

export default function BMR08(props: ForwardProps) {
  return <DemoApp appId="BMR08" name="BMR08" {...props} />;
}