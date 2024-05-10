import { useEffect, useState } from 'react';
import { vscode } from "./utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import "./App.css";

function App() {
  const [fileUri, setFileUri] = useState('');

  useEffect(() => {
    // Directly access the fileUri from window
    if (window.fileUri) {
      setFileUri(window.fileUri);
    }
  }, []);

  function handleHowdyClick() {
    // Post message with fileUri to the extension backend
    vscode.postMessage({
      command: "openFile",
      uri: fileUri,
    });
  }

  return (
    <main>
      <h1>Hello World!</h1>
      <VSCodeButton onClick={handleHowdyClick}>Howdy!</VSCodeButton>
    </main>
  );
}

export default App;
