const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`StockSense backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled promise rejection:', err);
  server.close(() => process.exit(1));
});
