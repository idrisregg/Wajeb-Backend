const config = {
    development: {
        type: 'local',
        path: './uploads'
    },
    production: {
        type: 'local',
        path: '/var/www/wajeb-app/uploads'
    },
    staging: {
        type: 'local',
        path: './uploads'
    }
};

const cloudStorage = {
    s3: {
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.MY_AWS_REGION,
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY
    },
    gcs: {
        bucket: process.env.GCS_BUCKET,
        keyFilename: process.env.GCS_KEY_FILE,
        projectId: process.env.GCS_PROJECT_ID
    },
    azure: {
        accountName: process.env.AZURE_STORAGE_ACCOUNT,
        accountKey: process.env.AZURE_STORAGE_KEY,
        containerName: process.env.AZURE_CONTAINER
    }
};

export { config, cloudStorage };
