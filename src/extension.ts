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
import { VisualizerPanel } from "./panels/VisualizerPanel";
import {getWebviewContent,LaunchFileParameters,getChangedParameters} from "./panels/ParameterChoice";
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

    const openInRosLaunchManager = vscode.commands.registerCommand('vscode-roslaunch.openInRosLaunchManager', async (uri: vscode.Uri) => {
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.One });
        
        const params = { filepath: uri.path};
        await client.sendRequest<LaunchFileParameters>("get_launch_file_parameters", params).then((parameters) => {
            console.log("Launch file analysis:", parameters);
            const panel = vscode.window.createWebviewPanel(
                'editLaunchParameters',
                'Edit Launch Parameters',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
        
            panel.webview.html = getWebviewContent(parameters);
        
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'updateParameters':
                            const updatedParameters = message.parameters;
                            const upd_result = getChangedParameters(parameters, updatedParameters);
                            const sendParams = {
                                colcon_path: env["COLCON_PREFIX_PATH"],
                                filepath: uri.path,
                                arguments: upd_result
                            };
                            console.log("Updated parameters:", sendParams);
                            client.sendRequest("parse_launch_file", sendParams).then((treeJson) => {
                                panel.dispose();
                                VisualizerPanel.render(context.extensionUri, vscode.ViewColumn.Two, treeJson);
                            }).catch((error) => {
                                console.error("Error analyzing launch file:", error);
                                panel.webview.postMessage({
                                    command: 'error',
                                    error: error.message
                                });
                            });
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );            
        }).catch((error) => {
            console.error("Error analyzing launch file:", error);
        });
    });

    context.subscriptions.push(openInRosLaunchManager);
}

export function deactivate() {
    console.log("deactivate roslaunch-analyze extension");
    if (!languageClient) {
        return undefined;
    }
    proc.kill();
    return languageClient.stop();
}
