export interface LaunchFileParameter {
    name: string;
    description: string;
    default_value: string;
    conditionally_included: boolean;
}

export type LaunchFileParameters = LaunchFileParameter[];

export function getChangedParameters(original: LaunchFileParameters, updated: any): Array<[string, string]> {
    const changedParameters: Array<[string, string]> = [];

    for (const param of original) {
        if (param.default_value !== updated[param.name]) {
            changedParameters.push([param.name, updated[param.name]]);
        }
    }

    return changedParameters;
}

// webviewContent.js
export function getWebviewContent(parameters: LaunchFileParameters) {
    const rows = parameters.map(({ name, default_value, description }) => `
        <tr>
            <td>${name}</td>
            <td>
                <input type="text" id="${name}" value=${default_value} placeholder="Default: ${default_value}" />
                <br>
                <small>${description}</small>
            </td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Edit Launch Parameters</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    height: calc(100vh - 140px);
                }
                th, td {
                    border: 1px solid #555;
                    padding: 12px;
                }
                th {
                    background-color: #2e7d32;
                    color: white;
                }
                tbody {
                    display: block;
                    max-height: calc(100vh - 240px);
                    overflow-y: auto;
                }
                table thead, table tbody tr {
                    display: table;
                    width: 100%;
                    table-layout: fixed;
                }
                td {
                    border: none;
                    padding: 12px;
                }
                input {
                    width: 100%;
                    padding: 10px;
                    box-sizing: border-box;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 1em;
                    background-color: #333;
                    color: white;
                }
                #submit-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }
                button {
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 1em;
                    cursor: pointer;
                    margin-bottom: 10px;
                }
                button:hover {
                    background-color: #45a049;
                }
                small {
                    color: #ccc;
                }
                h1 {
                    color: #81c784;
                    font-size: 1.5em;
                }
                #status-message, #error-message {
                    display: none;
                    padding: 10px;
                    border-radius: 4px;
                    margin-top: 10px;
                }
                #status-message {
                    background-color: #333;
                    color: white;
                    animation: flash-border 2s infinite;
                }
                #error-message {
                    background-color: #d32f2f;
                    color: white;
                }
                @keyframes flash-border {
                    0% { border: 2px solid blue; }
                    50% { border: 2px solid transparent; }
                    100% { border: 2px solid blue; }
                }
            </style>
        </head>
        <body>
            <h1>Edit Launch Parameters</h1>
            <table>
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            <div id="submit-container">
                <button id="submit">OK</button>
                <div id="status-message">Wait, tree is being built...</div>
                <div id="error-message"></div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('submit').addEventListener('click', () => {
                    const inputs = document.querySelectorAll('input');
                    const parameters = {};
                    let allFilled = true;
                    inputs.forEach(input => {
                        if (!input.value) {
                            allFilled = false;
                            input.style.borderColor = 'red';
                        } else {
                            parameters[input.id] = input.value;
                            input.style.borderColor = '';
                        }
                    });
                    if (allFilled) {
                        const submitButton = document.getElementById('submit');
                        const statusMessage = document.getElementById('status-message');
                        const errorMessage = document.getElementById('error-message');
                        
                        submitButton.disabled = true;
                        statusMessage.style.display = 'block';
                        errorMessage.style.display = 'none';
                        
                        vscode.postMessage({
                            command: 'updateParameters',
                            parameters
                        });
                    } else {
                        alert('Please fill all the fields.');
                    }
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'error') {
                        const submitButton = document.getElementById('submit');
                        const statusMessage = document.getElementById('status-message');
                        const errorMessage = document.getElementById('error-message');

                        submitButton.disabled = false;
                        statusMessage.style.display = 'none';
                        errorMessage.style.display = 'block';
                        errorMessage.textContent = message.error;
                    }
                });
            </script>
        </body>
        </html>
    `;
}
