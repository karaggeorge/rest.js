module.exports = registerEndpoints

const Deprecation = require('deprecation')

function registerEndpoints (octokit, routes) {
  Object.keys(routes).forEach(namespaceName => {
    if (!octokit[namespaceName]) {
      octokit[namespaceName] = {}
    }

    Object.keys(routes[namespaceName]).forEach(apiName => {
      let apiOptions = routes[namespaceName][apiName]

      const endpointDefaults = ['method', 'url', 'headers'].reduce((map, key) => {
        if (typeof apiOptions[key] !== 'undefined') {
          map[key] = apiOptions[key]
        }

        return map
      }, {})

      endpointDefaults.request = {
        validate: apiOptions.params
      }

      const request = octokit.request.defaults(endpointDefaults)

      if (apiOptions.deprecated) {
        octokit[namespaceName][apiName] = function deprecatedEndpointMethod () {
          octokit.log.warn(new Deprecation(`[@octokit/rest] ${apiOptions.deprecated}`))
          octokit[namespaceName][apiName] = request
          return request.apply(null, arguments)
        }

        return
      }

      octokit[namespaceName][apiName] = request

      // TODO: implement workaround below
      // // workaround for getRef / listRefs. Both endpoint currently use
      // // the same endpoint: `GET /repos/:owner/:repo/git/refs/<prefix or ref name>`
      // // depending on whether <prefix or ref name> matches a git reference
      // // exactly or if it matches multiple references as prefix, the server
      // // responds with an object or an array. We make sure that the responses of
      // // `.getRef()` & `.listRefs()` are predictable by checking the endpointParams,
      // // see https://github.com/octokit/rest.js/issues/1061
      // .then(response => {
      //   if (endpointDefaults.url === '/repos/:owner/:repo/git/refs/:ref') {
      //     if (!Array.isArray(response.data)) {
      //       return response
      //     }

      //     // simulate 404 error
      //     const error = new Error('Not found')
      //     error.name = 'HttpError'
      //     error.code = 404
      //     error.status = 'Not Found'
      //     response.headers.status = '404 Not Found'
      //     error.headers = response.headers
      //     throw error
      //   }

      //   if (endpointDefaults.url === '/repos/:owner/:repo/git/refs/:namespace') {
      //     if (!Array.isArray(response.data)) {
      //       response.data = [response.data]
      //     }
      //   }

      //   return response
      // })
      // .catch(error => {
      //   if (endpointDefaults.url !== '/repos/:owner/:repo/git/refs/:namespace') {
      //     throw error
      //   }

      //   if (error.code === 404) {
      //     error.headers.status = '200 OK'
      //     return {
      //       data: [],
      //       status: 200,
      //       headers: error.headers
      //     }
      //   }

      //   throw error
      // })
    })
  })
}
