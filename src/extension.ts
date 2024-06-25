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
import { exec } from 'child_process';
import { VisualizerPanel } from "./panels/launch_tree/VisualizerPanel";
import { getWebviewContent, LaunchFileParameters, LaunchFileParameter,getChangedParameters } from "./panels/launch_tree/ParameterChoice";

let proc: ChildProcessWithoutNullStreams;
let languageClient: LanguageClient | undefined = undefined;
let parameterCache: Map<string, [string, string][]> = new Map();

export async function activate(context: vscode.ExtensionContext) {
    console.log("Hello extension");

    let rosExtension = vscode.extensions.getExtension("ms-iot.vscode-ros");
    if (!rosExtension) {
        vscode.window.showErrorMessage("ROS extension not found");
        return;
    }
    let env = rosExtension.exports.getEnv();
    // Load parameterCache from local storage
    const storedCache = context.workspaceState.get<string>('parameterCache');
    if (storedCache) {
        parameterCache = new Map(JSON.parse(storedCache));
        console.log("Parameter cache loaded from local storage.");
    } else {
        console.log("No parameter cache found in local storage.");
    }

    // Find an available port
    const getPort = (await import('get-port')).default;
    const portNumbers = (await import('get-port')).portNumbers;
    const port = await getPort({ port: portNumbers(8100, 9000) });
    const connectionInfo = {
        port: port,
        host: "localhost"
    };

    // Check if roslaunch-language-server is executable
    exec("command -v roslaunch-language-server", (error, stdout, stderr) => {
        if (error) {
            console.error("roslaunch-language-server is not executable.");
            vscode.window.showInformationMessage(
                "roslaunch-language-server is not installed. Please install it from https://github.com/roslaunch-analyzer/roslaunch-language-server",
                "Open Link"
            ).then(selection => {
                if (selection === "Open Link") {
                    vscode.env.openExternal(vscode.Uri.parse("https://github.com/roslaunch-analyzer/roslaunch-language-server"));
                }
            });
            return;
        }

        console.log(`roslaunch-language-server is located at ${stdout.trim()}`);

        proc = spawn("roslaunch-language-server", ["--port", String(port)], {
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
        proc.on("error", (err) => {
            console.error(`Failed to spawn process: ${err.message}`);
        });
        proc.on("spawn", () => {
            console.log("Process spawned successfully.");
        });

        setTimeout(() => {
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

                const params = { filepath: uri.path };
                await client.sendRequest<LaunchFileParameters>("get_launch_file_parameters", params).then((parameters) => {
                    console.log("Launch file analysis:", parameters);

                    const showParams = JSON.parse(JSON.stringify(parameters));
                    // Apply cached parameters if available
                    const cachedParameters = parameterCache.get(uri.path);
                    if (cachedParameters) {
                        cachedParameters.forEach(([key, val]) => {
                            const param = showParams.find((p: LaunchFileParameter) => p.name === key);
                            if (param) {
                                param.default_value = val;
                            }
                        });
                    }

                    const panel = vscode.window.createWebviewPanel(
                        'editLaunchParameters',
                        'Edit Launch Parameters',
                        vscode.ViewColumn.Two,
                        {
                            enableScripts: true,
                            retainContextWhenHidden: true
                        }
                    );

                    panel.webview.html = getWebviewContent(showParams);

                    panel.webview.onDidReceiveMessage(
                        message => {
                            switch (message.command) {
                                case 'updateParameters':
                                    const updatedParameters = message.parameters;
                                    const upd_result = getChangedParameters(parameters, updatedParameters);
                                    parameterCache.set(uri.path, upd_result);

                                    // Save parameterCache to local storage
                                    context.workspaceState.update('parameterCache', JSON.stringify(Array.from(parameterCache.entries()))).then(() => {
                                        console.log("Parameter cache saved to local storage.",parameterCache);
                                    }, (error) => {
                                        console.error("Error saving parameter cache to local storage:", error);
                                    });

                                    const sendParams = {
                                        colcon_path: env["COLCON_PREFIX_PATH"],
                                        filepath: uri.path,
                                        arguments: upd_result
                                    };
                                    console.log("Updated parameters:", sendParams);
                                    client.sendRequest("parse_launch_file", sendParams).then((treeJson) => {
                                        console.log("Tree: ", treeJson);
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
        }, 5000); // Wait for 5 seconds to ensure the server has time to start
    });
}

export function deactivate() {
    console.log("deactivate roslaunch-analyze extension");
    if (!languageClient) {
        return undefined;
    }
    proc.kill();
    return languageClient.stop();
}
