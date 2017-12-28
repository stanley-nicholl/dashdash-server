const Controller = require('./controller')('Auth') //Auth is the model name
const { AuthModel, UserModel, TokenModel } = require('../models')
const bcrypt = require('bcryptjs')

class AuthController extends Controller {

  // Verify requestor is a user (includes admins)
  static isUser (req, res, next) {
    // Validate and decode token
    TokenModel.verifyAndExtractHeaderToken(req.headers)
    .catch(err => { throw new Error('invalidToken') })
    // Check for and retrieve user from database
    .then(token => UserModel.find(token.sub.id))
    // Verify user
    .then(user => {
      if (!user) throw new Error('requestorInvalid')
      next() // pass auth check
    })
    .catch(next) // fail auth check
  }

  // Verify requestor is specifically an admin
  static isAdmin (req, res, next) {
    // Validate and decode token
    TokenModel.verifyAndExtractHeaderToken(req.headers)
    .catch(err => { throw new Error('invalidToken') })
    // Check for and retrieve user from database
    .then(token => UserModel.find(token.sub.id))
    // Verify user
    .then(user => {
      if (!user) throw new Error('requestorInvalid')
      if (user.role !== 'admin') throw new Error('unauthorizedUser')
      next() // pass auth check
    })
    .catch(next) // fail auth check
  }

  static login (req, res, next) {
    // *** Login requires username and password (no token), and will return a token ***
    // Get supplied username and password and grab user match from db
    const { username, password } = req.body
    if (!username) throw new Error('missingUsername')
    if (!password) throw new Error('missingPassword')
    // Retrieve user match from database
    UserModel.getUserIdByUsername(username)
    .then(result => {
      if (!result) throw new Error('noSuchUser')
      // Get hash from auth database
      return AuthModel.find(result.id)
    })
    .then(result => {
      // Check for supplied password match against stored hash
      if (!bcrypt.compareSync(password, result.hashed_password)) throw new Error('invalidPassword')
      // Sign new token with user id
      return TokenModel.sign(result.user_id)
    })
    // Return token to client
    .then(token => res.status(201).json({ auth: token }))
    .catch(next)
  }

  static signup (req, res, next) {
    // *** Signup will create a new user; no token is required, however a token will be returned ***
    const { username, password, first_name, last_name } = req.body
    // Verify fields exist
    if (!username) throw new Error('missingUsername')
    if (!password) throw new Error('missingPassword')
    if (!first_name) throw new Error('missingFirstname')
    if (!last_name) throw new Error('missingLastname')
    // Verify that username is unique
    UserModel.getUserIdByUsername(username)
    .then(existingUser => {
      if (existingUser) throw new Error('duplicateUser')
      // If unique, add new user to users database; all new users created with role of 'user'
      const newUser = { username, first_name, last_name }
      return UserModel.create(newUser)
    })
    .then(newUser => {
      // Add hashed password to auth table
      const hashed_password = bcrypt.hashSync(password)
      return AuthModel.create({ user_id: newUser.id, hashed_password })
    })
    // Sign and return a token for the new user
    .then(result => TokenModel.sign(result.user_id))
    // Return token to client
    .then(token => res.status(201).json({ auth: token }))
    .catch(next)
  }

  static updatePassword (req, res, next) {
    const { password } = req.body
    if (!password) throw new Error('missingPassword')
    const hashed_password = bcrypt.hashSync(password)
    // Validate and decode token
    TokenModel.verifyAndExtractHeaderToken(req.headers)
    .catch(err => { throw new Error('invalidToken') })
    // Update password in database based on user id in token
    .then(token => AuthModel.update(token.sub.id, { hashed_password }))
    .then(result => res.status(200).json({ auth: result.user_id }))
    .catch(next)
  }

}

module.exports = AuthController