/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  sassOptions: {
    silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions'],
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;
