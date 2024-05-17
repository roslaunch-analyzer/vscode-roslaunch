import { createServer } from 'net';

export async function findFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, () => {
            const port = (server.address() as any).port;
            server.close(() => {
                resolve(port);
            });
        });
    });
}
