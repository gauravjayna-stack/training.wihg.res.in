// PM2 process manager config for running the WIHG API on a bare-metal
// Ubuntu/Debian server (no Docker). See DEPLOYMENT_LINUX.md.
// Usage: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      name: 'wihg-server',
      cwd: './server',
      script: 'src/index.js',
      instances: 1, // increase for cluster mode once you confirm session/file-upload behavior under load
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: '../logs/wihg-server-error.log',
      out_file: '../logs/wihg-server-out.log',
      time: true,
    },
  ],
};
