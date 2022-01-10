/*
  Import dependencies
*/
const fs = require('fs') // For working with the file system
const path = require('path') // For combining paths
const yamljs = require('yamljs') // For converting YAML to JSON
const express = require('express') // Main system for running the API
const morgan = require('morgan') // For outputing information about the requests
const cors = require('cors') // For handeling CORS
const swaggerUi = require('swagger-ui-express') // For hosting and displaying the APIs documentation
const OpenApiValidator = require('express-openapi-validator') // Validates all routes based on the requested resource
const { determineDocumentationLinks } = require('./lib/oas') // Function for determining if there are any documentation links to provide in case of an error

/*
  Setup database connection
*/
const db = require('./database/db')
db.connect()

/*
  Setup logging
*/
const { logger, logConfig } = require('@vtfk/logger');
logConfig({
  remote: {
    onlyInProd: false
  }
})

/*
  Setup express instance
*/
const app = express() // Creates the express instance
app.use(express.json()) // Automatically parse JSON body
app.use(morgan('dev')) // Output request information to stdout
// Handle CORS
const corsOptions = {
  origin: true,
  credentials: true
}
app.use(cors(corsOptions))

/*
  Documentation & Validation
  Host SwaggerUI and validate incoming requests based on OpenAPI 3.0 spesification files
*/
// Style the documentation
const swaggerUIOptions = {
  deepLinking: false,
  displayOperationId: true,
  customCss: '.topbar { background-color: #B2DCDA!important; } .topbar-wrapper img { content:url(\'./assets/vtfk-logo.svg\'); height: 100px; }',
  customfavIcon: './assets/favicon.ico',
  customSiteTitle: 'E18 API documentation'
}

// Host the documentation and register the validators for each version of the API
const oasDocumentationEndpoints = []
const routeChildren = fs.readdirSync(path.join(__dirname, 'routes'))
if (routeChildren && Array.isArray(routeChildren)) {
  for (let i = 0; i < routeChildren.length; i++) {
    const oasSpecPath = path.join(__dirname, 'routes', routeChildren[i], 'oas.yaml')
    if (fs.existsSync(oasSpecPath)) {
      // Load the file as JSON and determine what the endpoint will be
      const oasJSON = yamljs.load(oasSpecPath)
      const oasDocEndpoint = '/api/' + routeChildren[i] + '/docs'
      const oasDocAssets = '/api/' + routeChildren[i] + '/docs/assets';
      oasDocumentationEndpoints.push(oasDocEndpoint)

      // Host the spesification file
      app.use(oasDocEndpoint + '/oas.yaml', express.static(oasSpecPath))

      // Host the assets
      app.use(oasDocAssets, express.static(path.join(__dirname, '/assets')))

      // Host the documentation
      app.use(oasDocEndpoint, swaggerUi.serve, swaggerUi.setup(oasJSON, swaggerUIOptions))
      app.use(`${oasDocEndpoint}/`, swaggerUi.serve, swaggerUi.setup(oasJSON, swaggerUIOptions))

      // Register the API validator
      app.use(
        OpenApiValidator.middleware({
          apiSpec: oasSpecPath,
          validateRequests: true
        })
      )
    }
  }
}

/*
  Validate that the route exists and that the database is connected
*/
app.use('*', (req, res, next) => {
  // Validate that the route is specified in the spec
  if (!req.openapi) {
    next(new HTTPError(404, `The route ${req.originalUrl} does not exist`))
  }
  // Validate that the database is connected
  if (db.client.connection.readyState !== 1) {
    next({
      status: 500,
      message: 'Database is not connected'
    })
  } else {
    next()
  }
})

/*
  Authentication
*/
const passport = require('passport') // Engine for authenticating using different strategies
const headerAPIKeyStrategy = require('./auth/authentication/apikey') // Passport strategy for authenticating with APIKey
const HTTPError = require('./lib/vtfk-errors/httperror')
// Register strategies
passport.use(headerAPIKeyStrategy)
// Initialize passport
app.use(passport.initialize())
// Use strategies
app.all('*',
  passport.authenticate(['headerapikey'], { session: false }),
  (req, res, next) => {
    next();
  }
)

/*
  Routes
*/
// v1 routes
app.use('/api/v1/jobs', require('./routes/v1/jobs'))
app.use('/api/v1/readytasks', require('./routes/v1/readytasks'))
app.use('/api/v1/statistics', require('./routes/v1/statistics'))
app.use('/api/v1/apikeys', require('./routes/v1/apikeys'))

/*
  Send response
  All routes sets the req.response object so that it can be sent to the requestor by a common function
*/
app.use('/*', (req, res, next) => {
  let response
  if (req.query.metadata) {
    let itemCount = 0
    if (res.body && Array.isArray(res.body)) {
      itemCount = req.response.length
    }
    response = {
      __metadata: {
        uri: req.protocol + '://' + req.get('host') + req.baseUrl,
        operationId: req.openapi.schema.operationId || '',
        durationMS: (new Date().getMilliseconds()) - req.custom.timestamp.getMilliseconds(),
        items: itemCount,
        ...req.__metadata
      },
      data: res.body
    }
    const documentation = determineDocumentationLinks(req)
    if (documentation) { response.__metadata.documentation = documentation }
  } else {
    response = res.body
  }
  res.json(response)
  // res.type('json').send(JSON.stringify(response, null, 2));
})

/*
  Error handeling
*/
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') console.log('❌ Error occured ❌')
  // Construct an error object
  let error = {}
  // Setup the error object based on type
  if (typeof err === 'object') {
    // Get all enumurable and non-enumurable property from the error object
    Object.getOwnPropertyNames(err).forEach((key) => {
      error[key] = err[key]
    })
  } else if (typeof err === 'string') {
    error.message = err
  } else {
    error = err
  }
  // Attempt to link to documentation
  const documentation = determineDocumentationLinks(req, oasDocumentationEndpoints)
  if (documentation) { error.documentation = documentation }

  // Output the error
  if (process.env.NODE_ENV !== 'test') {
    const errorMessage = error.stack ? `${error.message}\n${error.stack}` : error.message;
    try {
      logger('error', errorMessage);
    } catch (err) {
      console.log('Error occured and Papertrail-logging failed');
      console.log(err);
      console.log('Original error:');
      console.log(errorMessage);
    }
  }

  // Send the error
  res.status(err.status || err.statusCode || 500).json(error)
  next()
})

/*
  Export the API
*/
module.exports = {
  app,
  db,
  oasDocumentationEndpoints
}
