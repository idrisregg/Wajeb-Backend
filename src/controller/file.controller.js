import File from '../models/file.model.js';
import User from '../models/user.model.js';
import path from 'path';
import s3Service from '../services/s3Service.js';

async function uploadFile(req, reply) {
    let uploadedFileKey = null;
    
    try {
        console.log('Upload started for user:', req.user.userId);
        
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentUpload = await File.findOne({
            uploadedBy: req.user.userId,
            createdAt: { $gte: oneDayAgo }
        });

        if (recentUpload) {
            const nextAllowedDate = new Date(recentUpload.createdAt.getTime() + 24 * 60 * 60 * 1000);
            return reply.status(429).send({ 
                error: 'Upload limit reached',
                message: `You can only upload one file per day. Next upload allowed: ${nextAllowedDate.toLocaleString()}`,
                nextAllowedDate: nextAllowedDate
            });
        }
        
        const parts = req.parts();
        let fileData = null;
        const fields = {};

        for await (const part of parts) {
            if (part.file) {
                console.log('Processing file:', part.filename);
                
                const allowedMimeTypes = [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ];

                if (!allowedMimeTypes.includes(part.mimetype)) {
                    return reply.status(400).send({ 
                        error: 'File type not allowed',
                        message: 'Only images (JPEG, PNG, GIF, WebP), PDF, and Word documents are allowed'
                    });
                }

                const fileExtension = path.extname(part.filename);
                const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;

                const chunks = [];
                for await (const chunk of part.file) {
                    chunks.push(chunk);
                }
                const fileBuffer = Buffer.concat(chunks);

                const s3Key = await s3Service.uploadFile(fileBuffer, uniqueFileName, part.mimetype);
                uploadedFileKey = s3Key;

                fileData = {
                    s3Key: s3Key,
                    uniqueName: uniqueFileName,
                    originalName: part.filename,
                    mime: part.mimetype,
                    size: fileBuffer.length
                };
            } else {
                fields[part.fieldname] = part.value;
            }
        }

        if (!fileData) {
            if (uploadedFileKey) {
                await s3Service.deleteFile(uploadedFileKey);
            }
            return reply.status(400).send({ 
                error: 'No file uploaded' 
            });
        }

        const { senderName, description, tags, recipientUserName } = fields;
        
        if (!senderName || !senderName.trim()) {
            if (uploadedFileKey) {
                await s3Service.deleteFile(uploadedFileKey);
            }
            return reply.status(400).send({ 
                error: 'Sender name is required' 
            });
        }

        if (!recipientUserName || !recipientUserName.trim()) {
            if (uploadedFileKey) {
                await s3Service.deleteFile(uploadedFileKey);
            }
            return reply.status(400).send({ 
                error: 'Recipient username is required' 
            });
        }

        const recipientUser = await User.findOne({ userName: recipientUserName.trim() });
        if (!recipientUser) {
            if (uploadedFileKey) {
                await s3Service.deleteFile(uploadedFileKey);
            }
            return reply.status(404).send({ 
                error: 'Recipient user not found',
                message: `No user found with username: ${recipientUserName.trim()}`
            });
        }

        const fileRecord = await File.create({
            fileName: fileData.uniqueName,
            originalName: fileData.originalName,
            filePath: fileData.s3Key,
            fileSize: fileData.size,
            mimeType: fileData.mime,
            uploadedBy: req.user.userId,
            recipientUserName: recipientUserName.trim(),
            senderName: senderName.trim(),
            description: description ? description.trim() : '',
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
        });

        reply.status(201).send({
            message: 'File uploaded successfully',
            file: {
                id: fileRecord._id,
                fileName: fileRecord.fileName,
                originalName: fileRecord.originalName,
                fileSize: fileRecord.fileSize,
                mimeType: fileRecord.mimeType,
                senderName: fileRecord.senderName,
                recipientUserName: fileRecord.recipientUserName,
                description: fileRecord.description,
                tags: fileRecord.tags,
                uploadedAt: fileRecord.createdAt
            }
        });

    } catch (error) {
        console.error('File upload error:', error);
        
        if (uploadedFileKey) {
            try {
                await s3Service.deleteFile(uploadedFileKey);
            } catch (cleanupError) {
                console.error('Error cleaning up S3 file:', cleanupError);
            }
        }
        
        reply.status(500).send({ 
            error: 'Failed to upload file',
            details: error.message
        });
    }
}

async function getAllFiles(req, reply) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const currentUser = await User.findById(req.user.userId);
        if (!currentUser) {
            return reply.status(404).send({ error: 'User not found' });
        }

        const query = {
            recipientUserName: currentUser.userName
        };

        const files = await File.find(query)
            .populate('uploadedBy', 'userName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await File.countDocuments(query);

        reply.send({
            files,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalFiles: total,
                hasNext: skip + files.length < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get files error:', error);
        reply.status(500).send({ 
            error: 'Failed to fetch files',
            details: error.message 
        });
    }
}

async function getFileById(req, reply) {
    try {
        const file = await File.findById(req.params.id).populate('uploadedBy', 'userName email');
        
        if (!file) {
            return reply.status(404).send({ 
                error: 'File not found' 
            });
        }

        const currentUser = await User.findById(req.user.userId);
        
        const isRecipient = file.recipientUserName === currentUser.userName;
        const isSender = file.uploadedBy._id.toString() === req.user.userId;
        
        if (!file.isPublic && !isRecipient && !isSender) {
            return reply.status(403).send({ 
                error: 'Access denied' 
            });
        }

        reply.send({ file });
    } catch (error) {
        console.error('Get file error:', error);
        reply.status(500).send({ 
            error: 'Failed to fetch file',
            details: error.message 
        });
    }
}

async function downloadFile(req, reply) {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return reply.status(404).send({ 
                error: 'File not found' 
            });
        }

        const currentUser = await User.findById(req.user.userId);
        
        const isRecipient = file.recipientUserName === currentUser.userName;
        const isSender = file.uploadedBy.toString() === req.user.userId;
        
        if (!file.isPublic && !isRecipient && !isSender) {
            return reply.status(403).send({ 
                error: 'Access denied' 
            });
        }

        const fileExists = await s3Service.fileExists(file.filePath);
        if (!fileExists) {
            return reply.status(404).send({ 
                error: 'File not found in storage' 
            });
        }

        await File.findByIdAndUpdate(req.params.id, { 
            $inc: { downloadCount: 1 } 
        });

        const fileStream = await s3Service.getFileStream(file.filePath);

        reply.header('Content-Disposition', `attachment; filename="${file.originalName}"`);
        reply.header('Content-Type', file.mimeType || 'application/octet-stream');
        
        return reply.send(fileStream);

    } catch (error) {
        console.error('Download file error:', error);
        reply.status(500).send({ 
            error: 'Failed to download file',
            details: error.message 
        });
    }
}

async function updateFile(req, reply) {
    try {
        const { senderName, description, tags, isPublic } = req.body;
        
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return reply.status(404).send({ 
                error: 'File not found' 
            });
        }

        if (file.uploadedBy.toString() !== req.user.userId) {
            return reply.status(403).send({ 
                error: 'Access denied' 
            });
        }

        const updateData = {};
        if (senderName) updateData.senderName = senderName;
        if (description !== undefined) updateData.description = description;
        if (tags) updateData.tags = tags.split(',').map(tag => tag.trim());
        if (isPublic !== undefined) updateData.isPublic = isPublic === 'true';

        const updatedFile = await File.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true }
        ).populate('uploadedBy', 'userName email');

        reply.send({
            message: 'File updated successfully',
            file: updatedFile
        });

    } catch (error) {
        console.error('Update file error:', error);
        reply.status(500).send({ 
            error: 'Failed to update file',
            details: error.message 
        });
    }
}

async function deleteFile(req, reply) {
    try {
        const fileId = req.params.id;
        console.log('DELETE request for file ID:', fileId);

        if (!fileId || fileId.length !== 24) {
            return reply.status(400).send({ 
                error: "Invalid file ID format" 
            });
        }

        const file = await File.findById(fileId);
        
        if (!file) {
            return reply.status(404).send({ 
                error: "File not found" 
            });
        }
        
        const currentUser = await User.findById(req.user.userId);
        if (!currentUser) {
            return reply.status(404).send({ 
                error: "User not found" 
            });
        }

        const isSender = file.uploadedBy.toString() === req.user.userId;
        const isRecipient = file.recipientUserName === currentUser.userName;
        
        if (!isSender && !isRecipient) {
            return reply.status(403).send({ 
                error: "Not authorized to delete this file" 
            });
        }
        
        try {
            await s3Service.deleteFile(file.filePath);
            console.log(`Deleted file from S3: ${file.filePath}`);
        } catch (s3Error) {
            console.error('Error deleting file from S3:', s3Error);
        }
        
        await File.findByIdAndDelete(fileId);
        console.log(`File ${fileId} deleted successfully`);
        
        reply.send({ 
            message: "File deleted successfully",
            fileId: fileId 
        });
    } catch (error) {
        console.error('Delete file error:', error);
        
        if (error.name === 'CastError') {
            return reply.status(400).send({ 
                error: "Invalid file ID format" 
            });
        }
        
        reply.status(500).send({ 
            error: "Failed to delete file",
            details: error.message 
        });
    }
}

export {
    uploadFile,
    getAllFiles,
    getFileById,
    downloadFile,
    updateFile,
    deleteFile
};