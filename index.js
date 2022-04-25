/*
  Import dependencies
*/
const http = require('http');
const { app, db, oasDocumentationEndpoints } = require('./app');
const config = require('./config') // Loads the config

/*
  Determine variables
*/
const host = config.hostname // Get the hosting address
const port = config.port // Get the hosting port

/*
  Functions
*/
async function outputServerEndpoints () {
  if (db.connectionPromise) await db.connectionPromise;

  server.listen(port, host, () => {
    let hostname = host
    if (host === '0.0.0.0') { hostname = 'localhost' }

    // Output the root adress the server is listening on
    console.log('\n\nRoot endpoint:')
    console.log('Your server is listening on port %d (http://%s:%d)', port, hostname, port)

    // Output API endpoint documentation URLs
    console.log('\nDocumentation endpoints:')
    oasDocumentationEndpoints.forEach((endpoint) => {
      console.log('http://%s:%d' + endpoint, hostname, port)
    })
  })
}

/*
  Host the server
*/
const server = http.createServer(app)

/*
  Output the configuration
*/
outputServerEndpoints();
