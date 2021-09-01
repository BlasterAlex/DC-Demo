//Install express server
const express = require('express');
const path = require('path');

const app = express();

// Serve only the static files form the dist directory
app.use(express.static('./dist/dc-demo'));

app.get('/*', (req, res) =>
  res.sendFile('index.html', {root: 'dist/dc-demo/'}),
);

// Start the app by listening on the default Heroku port
const port = process.env.PORT || 8080
app.listen(port,  () => {
  console.log(`Web server started at port :${port}`);
});
