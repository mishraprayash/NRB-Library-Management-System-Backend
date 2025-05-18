const path = require('path');

module.exports = {
  apps: [
    {
      name: 'library-web',
      script: path.join(__dirname, 'app.js'), // Absolute path
      instances: '1',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      error_file: path.join(__dirname, 'logs/web-error.log'),
      out_file: path.join(__dirname, 'logs/web-out.log'),
      time: true,
    },
    {
      name: 'library-worker',
      script: path.join(__dirname, 'worker.js'), // Absolute path
      instances: '1',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        WORKER_PORT: 5001,
      },
      error_file: path.join(__dirname, 'logs/worker-error.log'),
      out_file: path.join(__dirname, 'logs/worker-out.log'),
      time: true,
    },
  ],
};
