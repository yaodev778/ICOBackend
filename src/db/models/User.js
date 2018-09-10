const mongoose = require('mongoose');
const { Schema } = mongoose;
const crypto = require('crypto');
const token = require('lib/token');

const { PASSWORD_HASH_KEY: secret } = process.env;

function hash(password) {
  return crypto.createHmac('sha256', secret).update(password).digest('hex');
}

// const Wallet = new Schema({
//   BTC: Schema.Types.Double,
//   USD: Schema.Types.Double,
//   ETH: Schema.Types.Double
// }, { _id: false, strict: false });

const User = new Schema({
  displayName: String,
  email: String,
  fullname: String,
  address: String,
  company: String,
  website: String,
  social: {
    facebook: {
      id: String,
      accessToken: String
    },
    google: {
      id: String,
      accessToken: String
    }
  },
  password: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
});

User.statics.findByEmail = function(email) {
  return this.findOne({email}).exec();
};

User.statics.findByDisplayName = function(displayName) {
  return this.findOne({displayName}).exec();
};

User.statics.findExistancy = function({email, displayName}) {
  return this.findOne({
    $or: [
      {email},
      {displayName}
    ]
  }).exec();
};

User.statics.findSocialId = function({provider, id}) {
  const key = `social.${provider}.id`;

  return this.findOne({
    [key]: id
  });
};

User.statics.localRegister = async function({ displayName, email, password, fullname, address, company, website }) {
  const user = new this({
    displayName, 
    email,
    password: hash(password),
    fullname,
    address,
    company,
    website
  });

  return user.save();
};

User.statics.socialRegister = async function({
  displayName,
  email,
  fullname,
  address,
  company,
  website,
  provider,
  accessToken,
  socialId
}) {
  const user = new this({
    displayName,
    email,
    fullname,
    address,
    company,
    website,
    social: {
      [provider]: {
        id: socialId,
        accessToken: accessToken
      }
    }
  });

  return user.save();
};

User.methods.validatePassword = function(password) {
  const hashed = hash(password);
  return this.password === hashed;
};

User.methods.savePassword = async function(password) {
  this.password = hash(password);
};


User.methods.generateToken = function() {
  const { _id, displayName } = this;
  return token.generateToken({
    user: {
      _id,
      displayName
    }
  }, 'user');
};

// User.methods.saveEarnings = function(balance) {
//   if(!this.balanceHistory) {
//     return this.model('User').findByIdAndUpdate(this._id, {
//       $set: {
//         balanceHistory: [{
//           time: new Date(),
//           value: balance
//         }]
//       }
//     }).exec();
//   }

//   return this.model('User').findByIdAndUpdate(this._id, {
//     $push: {
//       balanceHistory: {
//         date: new Date(),
//         value: balance
//       }
//     }
//   }).exec();
// };

module.exports = mongoose.model('User', User);