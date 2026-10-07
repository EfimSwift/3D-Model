import Script from "next/script";

export function ModelViewerScript() {
  return (
    <Script
      type="module"
      src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
      strategy="afterInteractive"
    />
  );
}
