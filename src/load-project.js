const glob = require('glob')
const Path = require('path')
const fs = require('fs')

function loadProject(path) {
  const pattern = `${Path.join(process.cwd(), path)}/**`
  // console.log("loading", pattern)
  return new Promise((resolve, reject) => {
    glob(pattern, function(err, files) {
      // console.log("got files:", files)
      if (err) return reject(err)
      let data = {}
      files.forEach(function(f) {
        // TODO read .gitignore
        if (f.match(/node_modules/)) return
        if (!fs.statSync(f).isDirectory()) {
          let relativePath = Path.relative(path, f)
          if (relativePath === 'package.json') relativePath = 'package'
          data[relativePath] = fs.readFileSync(f, 'utf8')
          if (relativePath === 'package') data[relativePath] = JSON.parse(data[relativePath])
          // console.log(relativePath)
        }
      })
      resolve(data)
    })
  })
}

if (require.main === module) {
  loadProject('./tasks/python-test').then(console.log)
}

module.exports = loadProject