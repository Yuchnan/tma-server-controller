import express from 'express';
import cors from 'cors';
import Docker from 'dockerode';
import os from 'os';
import fs from 'fs';
import path from 'path';

const app = express();

// Determine socket path based on environment or platform
const socketPath = process.env.DOCKER_SOCKET_PATH ||
  (process.platform === 'win32' && !process.env.DOCKER_HOST ? '//./pipe/docker_engine' : '/var/run/docker.sock');

const dockerOptions = process.env.DOCKER_HOST
  ? { host: process.env.DOCKER_HOST }
  : { socketPath };

const docker = new Docker(dockerOptions);

app.use(cors());
app.use(express.json());

// Helper to get system / CPU temperature
async function getSystemTemperature() {
  const result = {
    available: false,
    main: null,
    max: null,
    sensors: [],
    unit: '°C'
  };

  // 1. Try Linux /sys/class/thermal (standard Linux & mounted /sys)
  try {
    const thermalPath = '/sys/class/thermal';
    if (fs.existsSync(thermalPath)) {
      const entries = await fs.promises.readdir(thermalPath);
      const zoneEntries = entries.filter(e => e.startsWith('thermal_zone'));

      for (const zone of zoneEntries) {
        try {
          const tempFile = path.join(thermalPath, zone, 'temp');
          const typeFile = path.join(thermalPath, zone, 'type');
          if (fs.existsSync(tempFile)) {
            const tempRaw = await fs.promises.readFile(tempFile, 'utf8');
            let type = zone;
            if (fs.existsSync(typeFile)) {
              type = (await fs.promises.readFile(typeFile, 'utf8')).trim();
            }

            let tempVal = parseFloat(tempRaw.trim());
            // Most kernels report millidegrees (e.g. 45000 = 45.0 C)
            if (tempVal > 1000) {
              tempVal = tempVal / 1000.0;
            }

            if (!isNaN(tempVal) && tempVal > 0 && tempVal < 150) {
              result.sensors.push({
                id: zone,
                label: type,
                temp: Number(tempVal.toFixed(1))
              });
            }
          }
        } catch {}
      }
    }
  } catch (e) {}

  // 2. Try Linux /sys/class/hwmon (coretemp, k10temp, acpitz, etc.)
  if (result.sensors.length === 0) {
    try {
      const hwmonPath = '/sys/class/hwmon';
      if (fs.existsSync(hwmonPath)) {
        const hwEntries = await fs.promises.readdir(hwmonPath);
        for (const hw of hwEntries) {
          const hwDir = path.join(hwmonPath, hw);
          let hwName = hw;
          try {
            const nameFile = path.join(hwDir, 'name');
            if (fs.existsSync(nameFile)) {
              hwName = (await fs.promises.readFile(nameFile, 'utf8')).trim();
            }
          } catch {}

          const files = await fs.promises.readdir(hwDir);
          const tempInputs = files.filter(f => f.startsWith('temp') && f.endsWith('_input'));
          for (const tFile of tempInputs) {
            try {
              const raw = await fs.promises.readFile(path.join(hwDir, tFile), 'utf8');
              let tempVal = parseFloat(raw.trim());
              if (tempVal > 1000) tempVal = tempVal / 1000.0;

              const baseName = tFile.replace('_input', '');
              let label = `${hwName} ${baseName}`;
              try {
                const labelFile = path.join(hwDir, `${baseName}_label`);
                if (fs.existsSync(labelFile)) {
                  const labelRaw = await fs.promises.readFile(labelFile, 'utf8');
                  label = `${hwName} ${labelRaw.trim()}`;
                }
              } catch {}

              if (!isNaN(tempVal) && tempVal > 0 && tempVal < 150) {
                result.sensors.push({
                  id: `${hw}_${baseName}`,
                  label,
                  temp: Number(tempVal.toFixed(1))
                });
              }
            } catch {}
          }
        }
      }
    } catch (e) {}
  }

  // Calculate main and max temperatures
  if (result.sensors.length > 0) {
    result.available = true;
    const cpuSensor = result.sensors.find(s => 
      /cpu|pkg|package|core|soc|k10temp|x86/i.test(s.label)
    );
    const temps = result.sensors.map(s => s.temp);
    result.max = Math.max(...temps);
    result.main = cpuSensor ? cpuSensor.temp : Number((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1));
  }

  return result;
}

// Helper to clean docker multiplex headers from logs
function sanitizeLogOutput(buffer) {
  if (!buffer) return '';
  if (typeof buffer === 'string') return buffer;
  
  // Docker stream format prefixes each line with an 8-byte header:
  // [stream_type (1 byte), 0, 0, 0, size (4 bytes)]
  let output = '';
  let offset = 0;
  
  while (offset < buffer.length) {
    if (offset + 8 <= buffer.length && (buffer[offset] === 1 || buffer[offset] === 2 || buffer[offset] === 0)) {
      const size = buffer.readUInt32BE(offset + 4);
      offset += 8;
      output += buffer.slice(offset, offset + size).toString('utf8');
      offset += size;
    } else {
      output += buffer.slice(offset).toString('utf8');
      break;
    }
  }
  
  return output || buffer.toString('utf8');
}

// 1. Health check & System Overview
app.get('/api/system/stats', async (req, res) => {
  try {
    let dockerInfo = {};
    let dockerAvailable = false;
    let versionInfo = {};

    try {
      [dockerInfo, versionInfo] = await Promise.all([
        docker.info(),
        docker.version()
      ]);
      dockerAvailable = true;
    } catch (e) {
      console.warn('Docker daemon info error:', e.message);
    }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = Math.round((usedMem / totalMem) * 100);

    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
    const cpuCount = cpus.length;
    const loadAvg = os.loadavg();
    const temperature = await getSystemTemperature();

    res.json({
      dockerAvailable,
      serverTime: new Date().toISOString(),
      uptime: os.uptime(),
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      osRelease: os.release(),
      temperature,
      memory: {
        totalBytes: totalMem,
        usedBytes: usedMem,
        freeBytes: freeMem,
        usagePercent: memUsagePercent
      },
      cpu: {
        model: cpuModel,
        cores: cpuCount,
        loadAvg: loadAvg.map(l => Number(l.toFixed(2)))
      },
      docker: dockerAvailable ? {
        version: versionInfo.Version || 'Unknown',
        apiVersion: versionInfo.ApiVersion || 'Unknown',
        containersTotal: dockerInfo.Containers || 0,
        containersRunning: dockerInfo.ContainersRunning || 0,
        containersPaused: dockerInfo.ContainersPaused || 0,
        containersStopped: dockerInfo.ContainersStopped || 0,
        imagesTotal: dockerInfo.Images || 0,
        serverVersion: dockerInfo.ServerVersion || 'Unknown',
        operatingSystem: dockerInfo.OperatingSystem || 'Unknown',
        ncpu: dockerInfo.NCPU || cpuCount,
        memTotal: dockerInfo.MemTotal || totalMem
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get all containers with extended details
app.get('/api/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const formatted = containers.map(c => {
      // Parse ports
      const ports = (c.Ports || []).map(p => {
        if (p.PublicPort) {
          return `${p.IP || '0.0.0.0'}:${p.PublicPort}->${p.PrivatePort}/${p.Type}`;
        }
        return `${p.PrivatePort}/${p.Type}`;
      });

      return {
        id: c.Id.slice(0, 12),
        fullId: c.Id,
        name: (c.Names[0] || '').replace(/^\//, ''),
        names: (c.Names || []).map(n => n.replace(/^\//, '')),
        state: c.State, // 'running', 'exited', 'paused', 'restarting', 'created'
        status: c.Status,
        image: c.Image,
        imageId: (c.ImageID || '').slice(0, 19),
        created: c.Created,
        ports: ports,
        rawPorts: c.Ports || [],
        labels: c.Labels || {},
        command: c.Command
      };
    });

    // Sort: running first, then by name
    formatted.sort((a, b) => {
      if (a.state === 'running' && b.state !== 'running') return -1;
      if (a.state !== 'running' && b.state === 'running') return 1;
      return a.name.localeCompare(b.name);
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Inspect single container
app.get('/api/containers/:id/inspect', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const data = await container.inspect();
    
    // Format inspect data for easy consumption
    const result = {
      id: data.Id.slice(0, 12),
      fullId: data.Id,
      name: data.Name.replace(/^\//, ''),
      created: data.Created,
      path: data.Path,
      args: data.Args,
      state: data.State,
      image: data.Config?.Image,
      env: data.Config?.Env || [],
      cmd: data.Config?.Cmd || [],
      workingDir: data.Config?.WorkingDir || '/',
      labels: data.Config?.Labels || {},
      restartPolicy: data.HostConfig?.RestartPolicy || {},
      ports: data.NetworkSettings?.Ports || {},
      networks: Object.keys(data.NetworkSettings?.Networks || {}).map(netName => ({
        name: netName,
        ipAddress: data.NetworkSettings.Networks[netName].IPAddress,
        gateway: data.NetworkSettings.Networks[netName].Gateway,
        macAddress: data.NetworkSettings.Networks[netName].MacAddress
      })),
      mounts: (data.Mounts || []).map(m => ({
        type: m.Type,
        source: m.Source,
        destination: m.Destination,
        mode: m.Mode,
        rw: m.RW
      }))
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Start container
app.post('/api/containers/:id/start', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.start();
    res.json({ success: true, message: `Container ${req.params.id} started` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Stop container
app.post('/api/containers/:id/stop', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.stop({ t: 10 });
    res.json({ success: true, message: `Container ${req.params.id} stopped` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Restart container
app.post('/api/containers/:id/restart', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.restart({ t: 10 });
    res.json({ success: true, message: `Container ${req.params.id} restarted` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Pause container
app.post('/api/containers/:id/pause', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.pause();
    res.json({ success: true, message: `Container ${req.params.id} paused` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Unpause container
app.post('/api/containers/:id/unpause', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.unpause();
    res.json({ success: true, message: `Container ${req.params.id} resumed` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Remove container
app.delete('/api/containers/:id', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const force = req.query.force === 'true';
    await container.remove({ force, v: true });
    res.json({ success: true, message: `Container ${req.params.id} removed` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Container Logs (tail + timestamps support)
app.get('/api/containers/:id/logs', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const tail = parseInt(req.query.tail, 10) || 100;
    const timestamps = req.query.timestamps === 'true';

    const logStream = await container.logs({
      stdout: true,
      stderr: true,
      tail: Math.min(tail, 1000),
      timestamps: timestamps
    });

    const cleanLogs = sanitizeLogOutput(logStream);
    res.json({
      id: req.params.id,
      tail,
      logs: cleanLogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Container Live Stats Snapshot (CPU, Memory, Network)
app.get('/api/containers/:id/stats', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const stats = await container.stats({ stream: false });

    // Calculate CPU %
    let cpuPercent = 0.0;
    if (stats.cpu_stats && stats.precpu_stats) {
      const cpuDelta = (stats.cpu_stats.cpu_usage?.total_usage || 0) - (stats.precpu_stats.cpu_usage?.total_usage || 0);
      const systemDelta = (stats.cpu_stats.system_cpu_usage || 0) - (stats.precpu_stats.system_cpu_usage || 0);
      const onlineCpus = stats.cpu_stats.online_cpus || stats.cpu_stats.cpu_usage?.percpu_usage?.length || 1;

      if (systemDelta > 0 && cpuDelta > 0) {
        cpuPercent = Number(((cpuDelta / systemDelta) * onlineCpus * 100.0).toFixed(2));
      }
    }

    // Memory calculation
    const memUsage = stats.memory_stats?.usage || 0;
    const memLimit = stats.memory_stats?.limit || 1;
    const memPercent = Number(((memUsage / memLimit) * 100.0).toFixed(2));

    // Network stats
    let rxBytes = 0;
    let txBytes = 0;
    if (stats.networks) {
      Object.values(stats.networks).forEach(net => {
        rxBytes += net.rx_bytes || 0;
        txBytes += net.tx_bytes || 0;
      });
    }

    // Block I/O stats
    let readBytes = 0;
    let writeBytes = 0;
    if (stats.blkio_stats?.io_service_bytes_recursive) {
      stats.blkio_stats.io_service_bytes_recursive.forEach(entry => {
        if (entry.op === 'Read') readBytes += entry.value || 0;
        if (entry.op === 'Write') writeBytes += entry.value || 0;
      });
    }

    res.json({
      id: req.params.id,
      readTime: stats.read,
      cpu: {
        usagePercent: Math.min(cpuPercent, 1000)
      },
      memory: {
        usedBytes: memUsage,
        limitBytes: memLimit,
        usagePercent: memPercent
      },
      network: {
        rxBytes,
        txBytes
      },
      blockIO: {
        readBytes,
        writeBytes
      },
      pids: stats.pids_stats?.current || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Prune unused containers / dangling images
app.post('/api/system/prune', async (req, res) => {
  try {
    const results = {};
    try {
      results.containersPruned = await docker.pruneContainers();
    } catch (e) {
      results.containersError = e.message;
    }
    try {
      results.imagesPruned = await docker.pruneImages({ filters: { dangling: { true: true } } });
    } catch (e) {
      results.imagesError = e.message;
    }
    try {
      results.networksPruned = await docker.pruneNetworks();
    } catch (e) {
      results.networksError = e.message;
    }
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[TMA Backend] Server running on port ${PORT}`);
  console.log(`[TMA Backend] Connected Docker endpoint: ${socketPath}`);
});