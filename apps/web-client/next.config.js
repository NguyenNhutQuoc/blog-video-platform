//@ts-check

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  transpilePackages: [
    '@blog/shared-ui-kit',
    '@blog/shared-data-access',
    '@blog/shared-utils',
    '@blog/shared/domain',
  ],
};

module.exports = nextConfig;
