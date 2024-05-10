import * as vscode from 'vscode';
import { RoslaunchAnalyzerServer } from './roslaunchAnalyzeServer';
import { VisualizerPanel } from "./panels/VisualizerPanel";

import * as fs from 'fs';
import * as path from 'path';
let analyzer = new RoslaunchAnalyzerServer();
let env: any;

function previewVisualizer() {
	const panel = vscode.window.createWebviewPanel(
		'showText',
		'Preview Visualizer',
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

class LaunchXMLDefinitionProvider {
	provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition> {
		const includeFileWordRange = document.getWordRangeAtPosition(position, /"\$\(find-pkg-share\s+[^)]+\)[^"]*"/g);
		if (!includeFileWordRange) {
			return;
		}
		const includeFile = document.getText(includeFileWordRange);
		const match = includeFile.match(/\$\(find-pkg-share\s+([^)]+)\)(\/[^"]*)/);
		const packageName = match ? match[1] : "";
		const extraPath = match ? match[2] : "";
		console.log(packageName);
		console.log(extraPath);

		const URI = packageName + "/" + encodeURIComponent(extraPath);
		return analyzer.client?.get("/get_definition_of_file/" + URI).then((response) => {
			console.log(response.data);
			return new vscode.Location(vscode.Uri.file(response.data.file_path), new vscode.Position(0, 0));
		});
	}
}




export function activate(context: vscode.ExtensionContext) {
	// get env from ros extension
	let rosExtension = vscode.extensions.getExtension("ms-iot.vscode-ros");
	env = rosExtension?.exports.getEnv();
	analyzer.open(8000, env);
	rosExtension?.exports.getEnv();
	let disposable = vscode.commands.registerCommand('vscode-roslaunch.Visualizer', previewVisualizer);
	context.subscriptions.push(disposable);
	vscode.languages.registerDefinitionProvider('xml', new LaunchXMLDefinitionProvider());

	const openInRosLaunchManager = vscode.commands.registerCommand('vscode-roslaunch.openInRosLaunchManager', async (uri: vscode.Uri) => {
		// Open the file in an editor
		const document = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.One });

		VisualizerPanel.render(context.extensionUri,vscode.ViewColumn.Two);
	  });
	
	context.subscriptions.push(openInRosLaunchManager);
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log("deactivate roslaunch-analyze extension");
	analyzer.close();
}



