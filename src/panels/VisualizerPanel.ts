import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn,commands} from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

/**
 * This class manages the state and behavior of Visualizer webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering Visualizer webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */

function openFile(fileUri: string) {
  // Correctly parse the URI
  if (fileUri.startsWith('/file:///')) {
      fileUri = fileUri.substring(8); // Remove 'file:///' to get the correct path
  }
  const uri = Uri.file(fileUri);
  commands.executeCommand('vscode.open', uri,ViewColumn.One);
}

export class VisualizerPanel {
  public static currentPanel: VisualizerPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  /**
   * The VisualizerPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(panel: WebviewPanel, extensionUri: Uri, jsonResponse: any){
    this._panel = panel;
    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri,jsonResponse);

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview);
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static render(extensionUri: Uri,paneltype: ViewColumn,jsonResponse: any) {
    if (VisualizerPanel.currentPanel) {
      // If the webview panel already exists reveal it
      VisualizerPanel.currentPanel._panel.reveal(paneltype);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        "showVisualizer",
        // Panel title
        "Ros Tree Visualizer",
        // The editor column the panel should be displayed in
        paneltype,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [Uri.joinPath(extensionUri, "out"), Uri.joinPath(extensionUri, "webview-ui/build")],
          enableFindWidget: true,
          retainContextWhenHidden: true
        }
      );
      panel.webview.onDidReceiveMessage(
          message => {
              switch (message.command) {
                  case 'openFile':
                      const uri = Uri.parse(message.uri);
                      openFile(uri.path)
                      break;
              }
          },
          undefined,
      );  
      VisualizerPanel.currentPanel = new VisualizerPanel(panel, extensionUri,jsonResponse);
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    VisualizerPanel.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
private _getWebviewContent(webview: Webview, extensionUri: Uri, jsonResponse: any) {
  // Paths to CSS and JS files
  const stylesUri = getUri(webview, extensionUri, [
    "webview-ui",
    "build",
    "static",
    "css",
    "main.css",
  ]);
  const scriptUri = getUri(webview, extensionUri, [
    "webview-ui",
    "build",
    "static",
    "js",
    "main.js",
  ]);

  const nonce = getNonce();
  const json_string = JSON.stringify(jsonResponse).replace(/'/g, "\\'").replace(/"/g, '\\"');
  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=yes">
        <meta name="theme-color" content="#000000">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <link rel="stylesheet" type="text/css" href="${stylesUri}">
        <title>Ros Tree Visualizer</title>
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>
        <script nonce="${nonce}">
          // Setting the global variable
          window.jsonResponse = "${json_string}";
        </script>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>
  `;
}


  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case "hello":
            // Code that should run in response to the hello message command
            window.showInformationMessage(text);
            return;
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
        }
      },
      undefined,
      this._disposables
    );
  }
}
