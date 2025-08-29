const userController = require('../controllers/user.controller');
const fp = require('fastify-plugin');

async function userRoutes(fastify) {
    fastify.post('/users/:id/address', {
        preHandler: [fastify.authenticate],
        handler: userController.addAddress,
    }
    )
    fastify.get('/users/:id/address', {
        preHandler: [fastify.authenticate],
        handler: userController.getAddresses,
    }
    )
    fastify.get('/advertisers', {
        preHandler: [fastify.authenticate],
        handler: userController.getAllAdvertisers,
    }
    )
    fastify.get('/advertisers/:id/ads', {
        preHandler: [fastify.authenticate],
        handler: userController.getAdsByAdvertiser,
    }
    )
    fastify.get('/advertiserId/:id', {
        preHandler: [fastify.authenticate],
        handler: userController.getMyAds,
    }
    )
    fastify.post('/upload-ad', {
        preHandler: [fastify.authenticate],
        handler: userController.uploadAdHandler,
    });
    fastify.put('/ads/:id', {
        preHandler: [fastify.authenticate],
        handler: userController.updateAd,
    });
    fastify.delete('/ads/:id', {
        preHandler: [fastify.authenticate],
        handler: userController.deleteAd,
    });
};

module.exports = fp(userRoutes);