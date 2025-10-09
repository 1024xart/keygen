// Bloom.tsx
"use client";
import DemoApp from "./DemoApp";
type ForwardProps = { onClose?: () => void };
export default function Bloom(props: ForwardProps) {
  return <DemoApp appId="bloom" name="Bloom" {...props} />;
}