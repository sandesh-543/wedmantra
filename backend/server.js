const app = require('./src/index');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api-docs`);
}); 