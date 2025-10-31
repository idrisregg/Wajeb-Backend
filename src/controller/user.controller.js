import User from '../models/user.model.js';

async function getAllUsers(req, reply) {
    try {
        const users = await User.find();
        reply.send(users);
    } catch (error) {
        reply.status(500).send(error);
    }
}

async function getUserById(req, reply) {
    try {
        const user = await User.findById(req.params.id);
        reply.send(user);
    } catch (error) {
        reply.status(500).send(error);
    }
}

async function createUser(req, reply) {
    try {
        const { email, userName, password } = req.body;
        
        const existingUser = await User.findOne({
            $or: [{ email }, { userName }]
        });
        
        if (existingUser) {
            if (existingUser.email === email) {
                return reply.status(400).send({ 
                    error: "User with this email already exists" 
                });
            }
            if (existingUser.userName === userName) {
                return reply.status(400).send({ 
                    error: "User with this username already exists" 
                });
            }
        }
        
        const user = await User.create({ email, userName, password });
        reply.status(201).send({
            message: "User created successfully",
            user: {
                id: user._id,
                email: user.email,
                userName: user.userName
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        reply.status(400).send({ 
            error: "Failed to create user",
            details: error.message 
        });
    }
}

async function updateUser(req, reply) {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        reply.send(user);
    } catch (error) {
        reply.status(400).send(error);
    }
}

async function deleteUser(req, reply) {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        reply.send(user);
    } catch (error) {
        reply.status(500).send(error);
    }
}

export {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};