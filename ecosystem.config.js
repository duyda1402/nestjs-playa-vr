module.exports = {
  apps: [
    {
      name: 'nestjs-playa-vr',
      script: './dist/main.js',
      instances: 'max',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
