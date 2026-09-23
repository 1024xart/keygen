export function Readme() {
  return (
    <article className="readme-sheet">
      <h2>readme.txt</h2>
      <pre>{`SEQUENCE-1024x

01  Open SEQUENCE.
02  Select a piece and generate its key.
03  Copy the key. Open the piece.
04  Enter the key to register it.
05  Return to SEQUENCE and apply the patch.

Click outside to return.
Keys and patches stay in this browser.`}</pre>
    </article>
  );
}
