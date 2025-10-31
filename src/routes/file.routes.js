import * as FileController from '../controller/file.controller.js';

async function routes(fastify, options) {
    fastify.post('/upload', { 
        onRequest: [fastify.jwtAuth],
    }, FileController.uploadFile);

    fastify.get('/', { 
        onRequest: [fastify.jwtAuth] 
    }, FileController.getAllFiles);

    fastify.get('/public', FileController.getAllFiles);

    fastify.get('/:id', { 
        onRequest: [fastify.jwtAuth] 
    }, FileController.getFileById);

    fastify.get('/:id/download', { 
        onRequest: [fastify.jwtAuth] 
    }, FileController.downloadFile);

    fastify.put('/:id', { 
        onRequest: [fastify.jwtAuth] 
    }, FileController.updateFile);

    fastify.delete('/:id', { 
        onRequest: [fastify.jwtAuth] 
    }, FileController.deleteFile);
}

export default routes;


