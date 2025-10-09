// Glitch.tsx
"use client";
import DemoApp from "./DemoApp";
type ForwardProps = { onClose?: () => void };
export default function Glitch(props: ForwardProps) {
  return <DemoApp appId="glitch" name="Glitch" {...props} />;
}