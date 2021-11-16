function determineDocumentationLinks (req, oasDocumentationEndpoints) {
  const requestedHost = req.protocol + '://' + req.get('host');

  let documentation;

  // Attempt to determine what documentation is correct for the failed request
  if (req.openapi && req.openapi.expressRoute) {
    // Attempt to match the express route with the API version
    let route = req.openapi.expressRoute;
    if (req.openapi.expressRoute.startsWith('/')) {
      route = route.substring(1);
    }
    const split = route.split('/');
    if (split.length >= 2) {
      const reconstructedRoute = '/' + split[0] + '/' + split[1] + '/docs';
      if (oasDocumentationEndpoints.includes(reconstructedRoute)) {
        documentation = {
          full: encodeURI(requestedHost + reconstructedRoute)
        }

        if (req.openapi.schema && req.openapi.schema.operationId && req.openapi.schema.tags) {
          documentation.method = encodeURI(requestedHost + reconstructedRoute + '/#/' + req.openapi.schema.tags[0] + '/' + req.openapi.schema.operationId)
        }
      }
    }
  }

  return documentation
}

module.exports = { determineDocumentationLinks }