const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
    images: {
        unoptimized: true,
    },
    reactStrictMode: false,
    typescript: {
        ignoreBuildErrors: true,
    },
    sassOptions: {
        includePaths: [
            path.join(__dirname, 'styles'),
            path.join(__dirname, 'node_modules'),
            path.join(__dirname, 'node_modules', 'bootstrap', 'scss'),
        ],
    },
    turbopack: {},
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            };
        }
        return config;
    },
    async rewrites() {
        return [
            {
                // Çalışanların "Diğer Taleplerim" menüsüne tıkladığında gideceği yer
                source: '/other-requests',
                destination: '/my-requests/other',
            },
            {
                // Adminlerin "Talep Yönetimi" menüsüne tıkladığında gideceği yer
                source: '/other-requests-management',
                destination: '/other-requests-management/requests',
            },
            {
                // Talep Türleri sayfası
                source: '/request-types',
                destination: '/other-requests-management/types',
            },
        ];
    },
}

module.exports = nextConfig