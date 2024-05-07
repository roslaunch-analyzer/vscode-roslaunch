import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import axios from "axios";

export class RoslaunchAnalyzerServer {
    port?: number;
    is_open: boolean = false;
    client?: axios.AxiosInstance;
    serverProcess?: ChildProcessWithoutNullStreams;


    open(port: number = 8000) {
        this.port = port;

        this.serverProcess = spawn("roslaunch-analyze-server", [
            "--port",
            this.port.toString(),
        ]);

        this.serverProcess.stdout.on("data", (data) => {
            console.log(`stdout: ${data}`);
        });

        this.serverProcess.stderr.on("data", (data) => {
            console.error(`stderr: ${data}`);
        });

        this.serverProcess.on("close", (code) => {
            console.log(`child process exited with code ${code}`);
        });

        this.client = axios.create({
            baseURL: `http://localhost:${this.port}`,
            timeout: 1000,
        });

        this.is_open = true;
    }


    close() {
        if (this.is_open) {
            console.log("Kill roslaunch-analyze-server");
            this.serverProcess?.kill();
        }
    }

}
