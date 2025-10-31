import * as UserController from '../controller/user.controller.js';
import { basicAuth } from "../middlewares/auth.js";
import User from "../models/user.model.js";

async function routes(fastify, options) {
    fastify.post("/login", async (request, reply) => {
        const { email, password } = request.body;
        if (!email || !password) {
            return reply.status(400).send({ 
                error: "Email and password are required" 
            });
        }
        
        try {
            const user = await User.findOne({ email }).select(["password", "userName", "email"]);

            if (!user) {
                return reply.status(401).send({ 
                    error: "Invalid email or password" 
                });
            }

            const isMatch = await user.comparePassword(password);

            if (!isMatch) {
                return reply.status(401).send({ 
                    error: "Invalid email or password" 
                });
            }

            const token = fastify.jwt.sign({
                userId: user._id,
                email: user.email,
                userName: user.userName
            }, {
                expiresIn: '24h'
            });
            
            reply.send({ 
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    userName: user.userName
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            return reply.status(500).send({ 
                error: "An error occurred during login" 
            });
        }
    });
    fastify.get("/", { onRequest: [fastify.jwtAuth] }, UserController.getAllUsers);
    fastify.get("/me", { onRequest: [fastify.jwtAuth] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const user = await User.findById(userId).select("-password");
            
            if (!user) {
                return reply.status(404).send({ 
                    error: "User not found" 
                });
            }
            
            reply.send({
                user: {
                    id: user._id,
                    email: user.email,
                    userName: user.userName
                }
            });
        } catch (error) {
            console.error('Get user info error:', error);
            reply.status(500).send({ 
                error: "An error occurred while fetching user info" 
            });
        }
    });
    
    fastify.get('/:id', UserController.getUserById);
    fastify.post('/', UserController.createUser);
    fastify.put('/:id', UserController.updateUser);
    fastify.delete('/:id',UserController.deleteUser);
}

export default routes;
