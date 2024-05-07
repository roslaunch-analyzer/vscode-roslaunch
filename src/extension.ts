import * as vscode from 'vscode';
import { RoslaunchAnalyzerServer } from './roslaunchAnalyzeServer';

let analyzer = new RoslaunchAnalyzerServer();


function previewHelloWorld() {
	const panel = vscode.window.createWebviewPanel(
		'showText',
		'Preview HelloWorld',
		vscode.ViewColumn.One,
		{
			enableScripts: true
		}
	);
	let text: string = "";
	analyzer.client?.get("/hello_world").then((response) => {
		text = response.data;
		console.log(text);
		panel.webview.html = `
		<html>
		<body>
			<h1>Preview</h1>
			<p>${text}</p>
		</body>
		</html>`;
	}
	);
}



export function activate(context: vscode.ExtensionContext) {
	analyzer.open(8000);
	let disposable = vscode.commands.registerCommand('vscode-roslaunch.helloWorld', previewHelloWorld);
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log("deactivate roslaunch-analyze extension");
	analyzer.close();
}
