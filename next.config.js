/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
  sassOptions: {
    silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions'],
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;
