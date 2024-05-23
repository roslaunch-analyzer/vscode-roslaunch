export interface LaunchFileParameters {
    [key: string]: {
        default: string;
        description: string;
    };
}

export function getChangedParameters(original: LaunchFileParameters, updated: any): Array<[string,string]> {
    const changedParameters: Array<[string,string]> = [];

    for (const key in original) {
        if (original[key].default !== updated[key]) {
            changedParameters.push([key,updated[key]]);
        }
    }

    return changedParameters;
}

// webviewContent.js
export function getWebviewContent(parameters:LaunchFileParameters) {
    const rows = Object.entries(parameters).map(([key, { default: defaultValue, description }]) => `
        <tr>
            <td>${key}</td>
            <td>
                <input type="text" id="${key}" value="${defaultValue}" placeholder="Default: ${defaultValue}" />
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
                    background-color: #388e3c;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                button {
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 1em;
                    cursor: pointer;
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
                        vscode.postMessage({
                            command: 'updateParameters',
                            parameters
                        });
                    } else {
                        alert('Please fill all the fields.');
                    }
                });
            </script>
        </body>
        </html>
    `;
}
