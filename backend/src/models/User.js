'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'employee', 'customer'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, index: true },

    phone: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },

    isActive: { type: Boolean, default: true, index: true },
    mustChangePassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },

    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },

    resetPasswordTokenHash: { type: String, select: false, default: null },
    resetPasswordExpires: { type: Date, default: null, select: false },

    // --- employee only (indexed via the partial index below, so non-employees
    //     which never have the field do not collide on a null key) ---
    employeeId: { type: String, default: undefined },
    department: { type: String, default: '', trim: true },
    designation: { type: String, default: '', trim: true },
    joinDate: { type: Date, default: null },

    // --- customer only ---
    companyName: { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.resetPasswordTokenHash;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
// Unique employee codes, but only for documents that actually have one.
userSchema.index(
  { employeeId: 1 },
  { unique: true, partialFilterExpression: { employeeId: { $type: 'string' } } },
);

userSchema.virtual('isLocked').get(function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.hashPassword = async function hashPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
  return this.passwordHash;
};

userSchema.methods.registerFailedLogin = function registerFailedLogin(
  maxAttempts = 5,
  lockMinutes = 15,
) {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= maxAttempts) {
    this.lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
    this.failedLoginAttempts = 0;
    return true; // account just locked
  }
  return false;
};

userSchema.methods.clearFailedLogins = function clearFailedLogins() {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
};

/** Safe representation used by controllers (drops password/reset fields). */
userSchema.methods.publicProfile = function publicProfile() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    avatar: this.avatar,
    isActive: this.isActive,
    mustChangePassword: this.mustChangePassword,
    lastLoginAt: this.lastLoginAt,
    employeeId: this.employeeId || null,
    department: this.department || null,
    designation: this.designation || null,
    joinDate: this.joinDate || null,
    companyName: this.companyName || null,
    createdAt: this.createdAt,
  };
};

async function nextEmployeeId() {
  const last = await this.findOne({ role: 'employee', employeeId: { $ne: null } })
    .sort({ createdAt: -1 })
    .select('employeeId')
    .lean();

  let seq = 1;
  if (last && last.employeeId) {
    const match = String(last.employeeId).match(/(\d+)$/);
    if (match) seq = Number(match[1]) + 1;
    if (!Number.isFinite(seq)) seq = 1;
  }
  return `KIN-EMP-${String(seq).padStart(3, '0')}`;
}

userSchema.pre('save', async function assignEmployeeId(next) {
  try {
    if (this.role === 'employee' && !this.employeeId) {
      // Guard against duplicates even if two admins create users at the same time.
      let id = await nextEmployeeId.call(this.constructor);
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const clash = await this.constructor.exists({ employeeId: id });
        if (!clash) break;
        const n = Number(String(id).match(/(\d+)$/)?.[1] || 0) + 1;
        id = `KIN-EMP-${String(n).padStart(3, '0')}`;
      }
      this.employeeId = id;
    }
    next();
  } catch (err) {
    next(err);
  }
});

/** Hash a password assigned directly on the document (used by seed + admin create). */
userSchema.pre('save', async function hashIfPlain(next) {
  try {
    if (
      this.isModified('passwordHash') &&
      this.passwordHash &&
      !this.passwordHash.startsWith('$2')
    ) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
