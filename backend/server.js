import express from 'express';
import cors from 'cors';
import Docker from 'dockerode';

const app = express();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

app.use(cors());
app.use(express.json());

// Get all containers status
app.get('/api/containers', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        const formatted = containers.map(c => ({
            id: c.Id.slice(0, 12),
            name: c.Names[0].replace('/', ''),
            state: c.State,
            status: c.Status,
            image: c.Image
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restart container
app.post('/api/containers/:id/restart', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.restart();
        res.json({ success: true, message: `Container ${req.params.id} restarted` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));