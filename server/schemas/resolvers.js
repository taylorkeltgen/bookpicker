const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    // Check is User is Logged In
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id }).select('-__v -password');

        return userData;
      }

      throw new AuthenticationError('Not logged in');
    },
    // Find All Users
    users: async () => {
      return User.find().select('-__v -password');
    },
    // Find One User
    user: async (parent, { username }) => {
      return User.findOne({ username }).select('-__v -password');
    },
    books: async () => {
      return Book.find();
    },
    book: async (parent, { _id }) => {
      return Book.findOne({ _id });
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, arg, context) => {
      if (context.user) {
        const book = await Book.findOne({ ...args, username: context.user.username });
        const book = await User.findByIdAndUpdate({ _id: context.user._id }, { $addToSet: { savedBooks: book._id } }, { new: true });
        return book;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    removeBook: async (parent, arg, context) => {
      if (context.user) {
        const updatedBookList = await User.findByIdAndUpdate({ _id: context.user._id }, { $pull: { savedBooks: book._id } }, { new: true });
        return updatedBookList;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

module.exports = resolvers;
