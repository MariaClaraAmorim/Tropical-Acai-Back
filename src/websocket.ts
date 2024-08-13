import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | undefined;

export const initializeWebSocket = (server: any) => {
    if (!wss) {
        wss = new WebSocketServer({ server });

        wss.on('connection', (ws: WebSocket) => {
            console.log('Client connected');
            ws.on('message', (message: string) => {
                console.log('Received message:', message);
            });

            ws.on('close', () => {
                console.log('Client disconnected');
            });

            ws.on('error', (error: Error) => {
                console.error('WebSocket error:', error);
            });
        });

        console.log('WebSocket server initialized');
    } else {
        console.warn('WebSocket server already initialized');
    }
};

export const broadcastOrder = (order: any) => {
    if (wss) {
        wss.clients.forEach((client: WebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'new_order', order }), (err) => {
                    if (err) {
                        console.error('Error sending message:', err);
                    }
                });
            }
        });
    } else {
        console.error('WebSocket server is not initialized');
    }
};
