const DEFAULT_DEV_JWT_SECRET = 'dev-only-insecure-jwt-secret';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.trim()) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }

  return DEFAULT_DEV_JWT_SECRET;
};

module.exports = { getJwtSecret };