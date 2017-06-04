module.exports = function(option) {
  console.log("type of option", typeof option)
  if (typeof option === 'object' && option.env) return process.env[option.env]
  return option
}