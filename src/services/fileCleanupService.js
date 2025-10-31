import File from '../models/file.model.js';
import s3Service from './s3Service.js';

class FileCleanupService {
    constructor() {
        this.cleanupInterval = 24 * 60 * 60 * 1000;
        this.startCleanup();
    }

    startCleanup() {
        this.cleanupExpiredFiles();
        
        setInterval(() => {
            this.cleanupExpiredFiles();
        }, this.cleanupInterval);

        console.log('File cleanup service started');
    }

    async cleanupExpiredFiles() {
        try {
            console.log('Starting file cleanup process');
            const startTime = Date.now();
            
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            const expiredFiles = await File.find({
                $or: [
                    { expiresAt: { $lte: new Date() } },
                    { createdAt: { $lte: sevenDaysAgo } }
                ]
            });

            console.log(`Found ${expiredFiles.length} expired files to clean up`);

            let successCount = 0;
            let failCount = 0;

            for (const file of expiredFiles) {
                try {
                    await s3Service.deleteFile(file.filePath);
                    console.log(`Deleted from S3: ${file.fileName}`);

                    await File.findByIdAndDelete(file._id);
                    console.log(`Deleted from DB: ${file.fileName}`);
                    
                    successCount++;
                } catch (error) {
                    console.error(`Error cleaning up file ${file.fileName}:`, error.message);
                    failCount++;
                }
            }

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`File cleanup completed in ${duration}s`);
            console.log(`Summary: ${successCount} successful, ${failCount} failed`);
            
        } catch (error) {
            console.error('Critical error during file cleanup:', error);
        }
    }

    async forceCleanup() {
        console.log('Force cleanup initiated');
        await this.cleanupExpiredFiles();
    }

    async getCleanupStats() {
        try {
            const now = new Date();
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            const totalFiles = await File.countDocuments();
            
            const expiredFiles = await File.countDocuments({
                $or: [
                    { expiresAt: { $lte: now } },
                    { createdAt: { $lte: sevenDaysAgo } }
                ]
            });
            
            const activeFiles = totalFiles - expiredFiles;

            const allFiles = await File.find({});
            const totalStorage = allFiles.reduce((sum, file) => sum + file.fileSize, 0);
            const expiredStorage = allFiles
                .filter(f => f.expiresAt <= now || f.createdAt <= sevenDaysAgo)
                .reduce((sum, file) => sum + file.fileSize, 0);

            return {
                totalFiles,
                expiredFiles,
                activeFiles,
                totalStorageBytes: totalStorage,
                expiredStorageBytes: expiredStorage,
                totalStorageMB: (totalStorage / (1024 * 1024)).toFixed(2),
                expiredStorageMB: (expiredStorage / (1024 * 1024)).toFixed(2),
                nextCleanup: new Date(Date.now() + this.cleanupInterval),
                cleanupIntervalHours: this.cleanupInterval / (60 * 60 * 1000)
            };
        } catch (error) {
            console.error('Error getting cleanup stats:', error);
            return null;
        }
    }
}

export default FileCleanupService;