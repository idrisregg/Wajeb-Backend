import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand, 
  HeadObjectCommand 
} from '@aws-sdk/client-s3';

class S3Service {
  constructor() {
    console.log('Initializing S3 Client');
    
    const hasCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
    console.log('AWS Credentials:', hasCredentials ? 'Provided' : 'Missing');

    if (!hasCredentials) {
      throw new Error('AWS credentials are required in environment variables');
    }

    const s3Config = {
      region: process.env.AWS_REGION || 'us-east-1',
    };

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
      };
    }

    s3Config.maxAttempts = 3;
    s3Config.retryMode = 'standard';

    this.s3Client = new S3Client(s3Config);
    this.bucketName = process.env.AWS_S3_BUCKET;
    
    console.log('S3 Client initialized successfully');
  }

  async uploadFile(fileBuffer, fileName, mimeType) {
    try {
      console.log(`Uploading to S3: ${fileName} (${fileBuffer.length} bytes)`);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);
      console.log(`S3 Upload Success: ${fileName}`);
      return fileName;
    } catch (error) {
      console.error('S3 Upload Error Details:', {
        message: error.message,
        code: error.Code,
        region: process.env.AWS_REGION,
        bucket: this.bucketName
      });
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  async deleteFile(fileKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('S3 Delete Error:', error);
      return false;
    }
  }

  async fileExists(fileKey) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      console.error('S3 file exists check error:', error);
      throw error;
    }
  }

  async getFileStream(fileKey) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const response = await this.s3Client.send(command);
      return response.Body;
    } catch (error) {
      console.error('S3 get file stream error:', error);
      throw new Error(`Failed to get file from S3: ${error.message}`);
    }
  }
}

const s3Service = new S3Service();
export default s3Service;