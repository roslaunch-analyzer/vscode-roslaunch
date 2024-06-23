<div align="center"><img src="icon.webp" height=200/></div>
<h1 align="center">🚀 vscode-roslaunch 🚀</h1>

This is the code repository for the vscode-roslaunch extension. The extension provides a bundle of [features](#features) to make ros2 development easier.

## Development Setup

Clone the repository along with the submodules
```
git clone --recurse-submodules https://github.com/roslaunch-analyzer/vscode-roslaunch.git
```
Build the extension and its parts using the following commands.
```
npm run build:lsp-server            # build server
npm run build:webview               # build webview
```
To test the extension, if you have not already, open the `vscode-roslaunch` folder as workspace in vscode. Then run the extension through the vscode debugger (```Ctrl+Shift+D```).

## Features

### Ros2 XML launch file features
1) [Launch Tree Visualization](https://github.com/roslaunch-analyzer/vscode-roslaunch/assets/38401989/4a8ce89f-b8ce-4728-8f31-78288425662b) 
2) Auto-Completion

<p align="center">
  <img src="https://github.com/roslaunch-analyzer/vscode-roslaunch/assets/38401989/90f8a296-2f11-4fca-be1b-6a304f83dfa6" alt="image" width="500"/>
</p>

<p align="center">
  <img src="https://github.com/roslaunch-analyzer/vscode-roslaunch/assets/38401989/03b13120-8a5d-4685-a88a-1bd1b516ca1b" alt="image" width="500"/>
</p>

<p align="center">
  <img src="https://github.com/roslaunch-analyzer/vscode-roslaunch/assets/38401989/e75f24e6-114e-41a6-ab18-cc92e3938fbe" alt="image" width="500"/>
</p>


<p align="center">
  <img src="https://github.com/roslaunch-analyzer/vscode-roslaunch/assets/38401989/8c5cbf8e-65a2-4d0f-9178-51f1a5de7040" alt="image" width="500"/>
</p>

4) Go-to-Definition


<p align="center">
  <img src="https://github.com/roslaunch-analyzer/vscode-roslaunch/assets/38401989/60ab5a6b-55cd-4f92-82f3-439436f545ae" alt="image" width="500"/>
</p>


<p align="center">
  <img src="https://github.com/roslaunch-analyzer/vscode-roslaunch/assets/38401989/22575f64-5691-4786-ba01-2d200f32abb9" alt="image" width="500"/>
</p>


<p align="center">
  <img src="https://github.com/roslaunch-analyzer/vscode-roslaunch/assets/38401989/debd1ea2-d700-47db-9290-8e97d9cb4bb8" alt="image" width="500"/>
</p>


5) Hover Description


<p align="center">
  <img src="https://github.com/roslaunch-analyzer/vscode-roslaunch/assets/38401989/d4e1ced4-66df-4495-91d4-2607954227c3" alt="image" width="500"/>
</p>


<p align="center">
  <img src="https://github.com/roslaunch-analyzer/vscode-roslaunch/assets/38401989/d22ac8c8-ff5e-456e-ab27-eccab4e631c7" alt="image" width="500"/>
</p>



