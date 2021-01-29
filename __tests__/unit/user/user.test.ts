import BaseUser from '../../../src/models/user/baseUserModel'
import User from '../../../src/models/user/userModel'
import Role from '../../../src/models/user/roleModel'
// update user tests
describe('Test user models', () => {
  const user = new BaseUser({
    name: 'test',
    surname: 'test',
    birthday: '1897-10-11',
    emails: [{ email: 'test@gmail.com', main: true }],
    password: 'test'
  })

  describe('Base user model', () => {
    describe('Insert', () => {
      test('should insert a base user', async () => {
        try {
          expect(await user.insert()).toBeUndefined()
        } catch (error) {
          console.log(error)
          expect(error).toBeUndefined()
        }
      })

      test('shouldn`t insert an user if already exists', async () => {
        try {
          await user.insert()
        } catch (error) {
          expect(error).toHaveProperty('details', 'User already exists!')
        }
      })
    })

    test('should update a base user', async () => {
      try {
        user.name = 'updated test'
        expect(await user.update()).toBeUndefined()
      } catch (error) {
        console.log(error)
        expect(error).toBeUndefined()
      }
    })

    test('should check if an user exists', async () => {
      expect(User.exist('test@gmail.com')).not.toBeUndefined()
    })

    test('should get an base user', async () => {
      try {
        const base_user = await User.getUser(user.user_id)
        expect(base_user.user_id).toBe(user.user_id)
      } catch (error) {
        console.log(error)
        expect(error).toBeUndefined()
      }
    })

    test('should delete an base user', async () => {
      try {
        expect(await user.delete()).toBeUndefined()
      } catch (error) {
        console.log(error)
        expect(error).toBeUndefined()
      }
    })
  })

  describe('User model', () => {
    let Aris_user: User

    describe('create', () => {
      test('should create an Aris user', async () => {
        try {
          await user.insert()
          Aris_user = new User({ ...user, cpf: '467-954-789-35', phone: '(16)99856-8791' })
          expect(await Aris_user.update()).toBeUndefined()
        } catch (error) {
          console.log(error)
          expect(error).toBeUndefined()
        }
      })

      test('shouldn`t be able to insert an Aris user', async () => {
        try {
          await Aris_user.insert()
        } catch (error) {
          expect(error).toHaveProperty('message', 'Aris User can´t be inserted!')
        }
      })
    })

    describe('Update', () => {
      test('should update an Aris user', async () => {
        try {
          Aris_user.name = 'updated test'
          expect(await Aris_user.update()).toBeUndefined()
        } catch (error) {
          console.log(error)
          expect(error).toBeUndefined()
        }
      })
    })

    describe('Role', () => {
      test('should update the role of an user', async () => {
        try {
          expect(Aris_user.roles[0]).toBe('guest')
          await Aris_user.updateRole('aris', 'guest')
          expect(Aris_user.roles[0]).toBe('aris')
        } catch (error) {
          console.log(error)
          expect(error).toBeUndefined()
        }
      })

      test('should replace "aris user" role when is the first time that a role is added', async () => {
        try {
          const { role_id } = await Role.getRole('student')

          expect(Aris_user.roles).toEqual(expect.arrayContaining(['aris']))
          await Aris_user.addRole(role_id)
          expect(Aris_user.roles).toEqual(expect.arrayContaining(['student']))
        } catch (error) {
          console.log(error)
          expect(error).toBeUndefined()
        }
      })

      test('should add role to the user', async () => {
        try {
          const { role_id } = await Role.getRole('professor')

          expect(Aris_user.roles).toEqual(expect.arrayContaining(['student']))
          await Aris_user.addRole(role_id)
          expect(Aris_user.roles).toEqual(expect.arrayContaining(['student', 'professor']))
        } catch (error) {
          console.log(error)
          expect(error).toBeUndefined()
        }
      })

      test('should update the role correctly when the user already has more than one role', async () => {
        try {
          expect(Aris_user.roles).toEqual(expect.arrayContaining(['student', 'professor']))
          await Aris_user.updateRole('moderator', 'student')
          expect(Aris_user.roles).toEqual(expect.arrayContaining(['moderator', 'professor']))
        } catch (error) {
          console.log(error)
          expect(error).toBeUndefined()
        }
      })

      test('should remove role of the user', async () => {
        try {
          const { role_id } = await Role.getRole('moderator')

          expect(Aris_user.roles).toEqual(expect.arrayContaining(['moderator', 'professor']))
          await Aris_user.removeRole(role_id)
          expect(Aris_user.roles).toEqual(expect.arrayContaining(['professor']))
        } catch (error) {
          console.log(error)
          expect(error).toBeUndefined()
        }
      })
    })

    describe('Get', () => {
      test('should get an user using the id', async () => {
        try {
          const user = await User.getUser(Aris_user.user_id)
          expect(user.user_id).toBe(Aris_user.user_id)
        } catch (error) {
          console.log(error)
          expect(error).toBeUndefined()
        }
      })

      test('shouldn`t get an user using invalid id', async () => {
        try {
          const user = await User.getUser(-1)
          expect(user).toBeUndefined()
        } catch (error) {
          expect(error).toHaveProperty('details', 'User don`t exists!')
        }
      })

      test('should get an user using the main email', async () => {
        try {
          const user = await User.getUser('test@gmail.com')
          expect(user.emails[0].email).toBe('test@gmail.com')
        } catch (error) {
          console.log(error)
          expect(error).toBeUndefined()
        }
      })

      test('shouldn`t get an user using invalid email', async () => {
        try {
          const user = await User.getUser('')
          expect(user).toBeUndefined()
        } catch (error) {
          expect(error).toHaveProperty('details', 'User don`t exists!')
        }
      })
    })

    test('should check if an user exists', async () => {
      expect(User.exist('test@gmail.com')).not.toBeUndefined()
    })

    test('should delete an Aris user', async () => {
      try {
        expect(await Aris_user.delete()).toBeUndefined()
      } catch (error) {
        console.log(error)
        expect(error).toBeUndefined()
      }
    })
  })
})
