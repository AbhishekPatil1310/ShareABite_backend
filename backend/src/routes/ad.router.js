const { model } = require('mongoose');
const {getAllAds,getAdById} = require('../controllers/ad.controller');
const fp = require('fastify-plugin');

async function adRoutes(fastify) {
    fastify.get('/ads', {
        preHandler: [fastify.authenticate],
        handler: getAllAds,
    });
    fastify.get('/ads/:id', {
        preHandler: [fastify.authenticate],
        handler: getAdById,
    });
}

module.exports = fp(adRoutes);