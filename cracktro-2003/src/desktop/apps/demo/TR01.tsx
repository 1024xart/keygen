// TR01.tsx
"use client";
import DemoApp from "./DemoApp";

type ForwardProps = { onClose?: () => void };

export default function TR01(props: ForwardProps) {
  return <DemoApp appId="TR01" name="TR01" {...props} />;
}