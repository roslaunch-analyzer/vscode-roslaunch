import * as vscode from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
	StreamInfo
} from 'vscode-languageclient/node';
import * as net from 'net';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

let proc: ChildProcessWithoutNullStreams;
let languageClient: LanguageClient | undefined = undefined;

export async function activate(context: vscode.ExtensionContext) {
	console.log("Hello extension");

	let rosExtension = vscode.extensions.getExtension("ms-iot.vscode-ros");
	if (!rosExtension) {
		vscode.window.showErrorMessage("ROS extension not found");
		return;
	}
	let env = rosExtension.exports.getEnv();

	const connectionInfo = {
		port: 8080,
		host: "localhost"
	};

	proc = spawn("roslaunch-language-server", ["--port", "8080"], {
		env: env
	});
	
	proc.stdout.on("data", (data) => {
		console.log(`stdout: ${data}`);
	});
	proc.stderr.on("data", (data) => {
		console.error(`stderr: ${data}`);
	});
	proc.on("close", (code) => {
		console.log(`child process exited with code ${code}`);
	});

	await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds to ensure the server has time to start

	let serverOptions = () => {
		return new Promise<StreamInfo>((resolve, reject) => {
			let socket = net.connect(connectionInfo, () => {
				console.log("Connected to server");
				resolve({
					writer: socket,
					reader: socket
				});
			}).on('error', (err) => {
				console.error(`Could not connect to server: ${err.message}`);
				reject(err);
			});
		});
	};

	let client = new LanguageClient(
		"Roslaunch Language Server",
		"roslaunch-language-server",
		serverOptions,
		{
			documentSelector: [
				{ scheme: 'file', language: 'xml' }
			]
		}
	);

	console.log("activate roslaunch-analyze extension");
	client.start().then(() => {
		console.log("Client has started");
	}, (err) => {
		console.error(`Client failed to start: ${err.message}`);
	});

	client.sendRequest("hello_world", { hello: "world" }).then((response) => {
		console.log("hello");
		console.log(response);
	});

	context.subscriptions.push(client);

	console.log("Client Activated");
}

export async function deactivate() {
	console.log("deactivate roslaunch-analyze extension");
	if (!languageClient) {
		return undefined;
	}
	proc.kill();
	return languageClient.stop();
}
