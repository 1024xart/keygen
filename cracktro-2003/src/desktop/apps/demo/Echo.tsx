// Echo.tsx
"use client";
import DemoApp from "./DemoApp";
type ForwardProps = { onClose?: () => void };
export default function Echo(props: ForwardProps) {
  return <DemoApp appId="echo" name="Echo" {...props} />;
}