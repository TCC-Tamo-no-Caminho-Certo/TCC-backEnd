module.exports = {
  professor (req, res, next) {
    const professor = req.role === 'professor'
  
    if (!professor) return res.status(401).send({ Error: 'User is not a professor!' })
    next()
  }
}